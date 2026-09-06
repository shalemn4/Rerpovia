import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from app.database import get_db
from app.models.run import Run, RunStep, RunStatusEnum
from app.models.workflow import WorkflowVersion
from app.models.provenance import ProvenanceRecord
from app.execution.orchestrator import orchestrator
from app.provenance.builder import create_immutable_provenance_record
from app.provenance.comparator import compare_runs, ReproductionReport
from app.workflows.validator import validate_and_normalize_workflow

router = APIRouter(prefix="/api/reproduction", tags=["reproduction"])

class ReproduceRunRequest(BaseModel):
    run_id: str
    custom_parameters: dict | None = None
    custom_environment_vars: dict | None = None

@router.post("/trigger")
async def trigger_reproduction(req: ReproduceRunRequest, db: AsyncSession = Depends(get_db)):
    """
    Executes a high-fidelity reproduction of an existing run:
    1. Reads original provenance record (pinned workflow version, container digests, parameters, environment).
    2. Spawns a new Run with reproduction_of_run_id pointing to original.
    3. Initiates execution through identical pipeline.
    """
    orig_run = await db.get(Run, req.run_id)
    if not orig_run:
        raise HTTPException(status_code=404, detail="Original run not found")

    p_stmt = select(ProvenanceRecord).where(ProvenanceRecord.run_id == req.run_id)
    p_rec = (await db.execute(p_stmt)).scalars().first()
    if not p_rec:
        raise HTTPException(status_code=400, detail="Provenance record not found for original run")

    wf_ver = await db.get(WorkflowVersion, orig_run.workflow_version_id)
    if not wf_ver:
        raise HTTPException(status_code=404, detail="Workflow version definition missing")

    val_res = validate_and_normalize_workflow(wf_ver.raw_yaml)
    if not val_res.is_valid:
        raise HTTPException(status_code=400, detail="Cannot reproduce: workflow YAML invalid")

    count_stmt = select(func.count()).select_from(Run)
    total_runs = (await db.execute(count_stmt)).scalar() or 0
    new_run_number = total_runs + 185

    # Use original parameters/env unless explicitly overridden for sensitivity analysis
    params = req.custom_parameters if req.custom_parameters is not None else json.loads(p_rec.parameters_json)
    env_vars = req.custom_environment_vars if req.custom_environment_vars is not None else json.loads(p_rec.environment_vars_json)

    new_run_id = str(uuid.uuid4())
    new_run = Run(
        id=new_run_id,
        project_id=orig_run.project_id,
        workflow_version_id=wf_ver.id,
        run_number=new_run_number,
        status=RunStatusEnum.QUEUED,
        triggered_by=f"Reproduction of Run #{orig_run.run_number}",
        reproduction_of_run_id=orig_run.id,
        parameters=json.dumps(params),
        environment_vars=json.dumps(env_vars),
        kubernetes_namespace=orig_run.kubernetes_namespace
    )
    db.add(new_run)

    for step_name in val_res.normalized_dag["steps"].keys():
        step_spec = val_res.normalized_dag["steps"][step_name]
        step = RunStep(
            id=str(uuid.uuid4()),
            run_id=new_run_id,
            step_name=step_name,
            image=step_spec["image"],
            status=RunStatusEnum.QUEUED
        )
        db.add(step)

    await db.commit()

    # Immutable provenance for new run
    await create_immutable_provenance_record(
        run_id=new_run_id,
        workflow_version=wf_ver,
        parameters=params,
        env_vars=env_vars
    )

    # Dispatch to orchestrator
    await orchestrator.trigger_run(
        run_id=new_run_id,
        workflow_version_yaml=wf_ver.raw_yaml,
        parameters=params,
        env_vars=env_vars,
        reproduction_of=orig_run.id
    )

    return {
        "new_run_id": new_run_id,
        "new_run_number": new_run_number,
        "original_run_id": orig_run.id,
        "original_run_number": orig_run.run_number,
        "status": "QUEUED",
        "message": f"Reproduction Run #{new_run_number} started against Run #{orig_run.run_number}."
    }

@router.get("/compare", response_model=ReproductionReport)
async def compare_run_results(original_run_id: str, reproduced_run_id: str):
    """
    Computes rigorous scientific comparison report between original and reproduction runs.
    Outputs status as MATCHED, DIFFERENT, or INCONCLUSIVE.
    """
    try:
        report = await compare_runs(original_run_id, reproduced_run_id)
        return report
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
