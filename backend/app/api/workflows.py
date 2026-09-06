import hashlib
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.workflow import Workflow, WorkflowVersion, WorkflowStep
from app.workflows.validator import validate_and_normalize_workflow
from app.schemas.workflow_yaml import ValidationResult

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

class ValidateRequest(BaseModel):
    yaml_content: str

class CreateWorkflowRequest(BaseModel):
    project_id: str
    name: str
    description: str = ""
    tags: list[str] = []
    yaml_content: str

class PublishVersionRequest(BaseModel):
    yaml_content: str

@router.post("/validate", response_model=ValidationResult)
async def validate_yaml(req: ValidateRequest):
    """
    Validates workflow YAML against schema and verifies acyclicity (DAG).
    Returns syntax/schema/dependency errors or normalized DAG for React Flow.
    """
    return validate_and_normalize_workflow(req.yaml_content)

@router.get("")
async def list_workflows(project_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Lists all workflows for a project."""
    stmt = select(Workflow)
    if project_id:
        stmt = stmt.where(Workflow.project_id == project_id)
    workflows = (await db.execute(stmt)).scalars().all()

    results = []
    for wf in workflows:
        # Get latest version
        v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == wf.id).order_by(WorkflowVersion.version_number.desc()).limit(1)
        latest_ver = (await db.execute(v_stmt)).scalars().first()
        results.append({
            "id": wf.id,
            "name": wf.name,
            "slug": wf.slug,
            "description": wf.description,
            "tags": json.loads(wf.tags) if wf.tags else [],
            "version": latest_ver.version_number if latest_ver else 1,
            "created_at": wf.created_at.isoformat(),
            "updated_at": wf.updated_at.isoformat()
        })
    return results

@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full workflow details, latest version YAML, and normalized DAG."""
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == wf.id).order_by(WorkflowVersion.version_number.desc()).limit(1)
    latest_ver = (await db.execute(v_stmt)).scalars().first()

    raw_yaml = latest_ver.raw_yaml if latest_ver else ""
    val_res = validate_and_normalize_workflow(raw_yaml) if raw_yaml else None

    return {
        "id": wf.id,
        "project_id": wf.project_id,
        "name": wf.name,
        "slug": wf.slug,
        "description": wf.description,
        "tags": json.loads(wf.tags) if wf.tags else [],
        "version": latest_ver.version_number if latest_ver else 1,
        "raw_yaml": raw_yaml,
        "checksum": latest_ver.checksum if latest_ver else "",
        "normalized_dag": val_res.normalized_dag if val_res else None,
        "is_valid": val_res.is_valid if val_res else True,
        "created_at": wf.created_at.isoformat(),
        "updated_at": wf.updated_at.isoformat()
    }

@router.post("")
async def create_workflow(req: CreateWorkflowRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new workflow and publishes its initial version."""
    # First validate YAML
    val_res = validate_and_normalize_workflow(req.yaml_content)
    if not val_res.is_valid:
        raise HTTPException(status_code=400, detail={"errors": [e.model_dump() for e in val_res.errors]})

    wf_id = str(uuid.uuid4())
    slug = req.name.lower().replace(" ", "-")

    wf = Workflow(
        id=wf_id,
        project_id=req.project_id,
        name=req.name,
        slug=slug,
        description=req.description,
        tags=json.dumps(req.tags)
    )
    db.add(wf)

    checksum = hashlib.sha256(req.yaml_content.encode()).hexdigest()
    wf_ver = WorkflowVersion(
        id=str(uuid.uuid4()),
        workflow_id=wf_id,
        version_number=1,
        raw_yaml=req.yaml_content,
        checksum=checksum
    )
    db.add(wf_ver)
    await db.commit()

    return {"id": wf_id, "name": req.name, "version": 1, "checksum": checksum}

@router.post("/{workflow_id}/versions")
async def publish_new_version(workflow_id: str, req: PublishVersionRequest, db: AsyncSession = Depends(get_db)):
    """Publishes an immutable new version of a workflow."""
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    val_res = validate_and_normalize_workflow(req.yaml_content)
    if not val_res.is_valid:
        raise HTTPException(status_code=400, detail={"errors": [e.model_dump() for e in val_res.errors]})

    # Get max version
    v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == workflow_id).order_by(WorkflowVersion.version_number.desc()).limit(1)
    prev_ver = (await db.execute(v_stmt)).scalars().first()
    new_ver_num = (prev_ver.version_number + 1) if prev_ver else 1

    checksum = hashlib.sha256(req.yaml_content.encode()).hexdigest()
    new_ver = WorkflowVersion(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        version_number=new_ver_num,
        raw_yaml=req.yaml_content,
        checksum=checksum
    )
    db.add(new_ver)
    await db.commit()

    return {
        "workflow_id": workflow_id,
        "version": new_ver_num,
        "checksum": checksum,
        "normalized_dag": val_res.normalized_dag
    }
