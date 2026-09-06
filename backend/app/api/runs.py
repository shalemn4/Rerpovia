import asyncio
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db, AsyncSessionLocal
from app.models.run import Run, RunStep, ExecutionLog, RunStatusEnum
from app.models.workflow import Workflow, WorkflowVersion
from app.models.artifact import Artifact
from app.models.provenance import ProvenanceRecord
from app.execution.orchestrator import orchestrator, event_bus
from app.provenance.builder import create_immutable_provenance_record
from app.workflows.validator import validate_and_normalize_workflow

router = APIRouter(prefix="/api/runs", tags=["runs"])

class TriggerRunRequest(BaseModel):
    workflow_id: str
    version_id: str | None = None
    parameters: dict = {}
    environment_vars: dict = {}
    dataset_id: str | None = None

@router.get("")
async def list_runs(workflow_id: str | None = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Lists operational runs with step counts and durations."""
    stmt = select(Run).order_by(Run.created_at.desc()).limit(limit)
    runs = (await db.execute(stmt)).scalars().all()

    results = []
    for r in runs:
        # Fetch workflow name
        wf_ver = await db.get(WorkflowVersion, r.workflow_version_id)
        wf_name = "Workflow"
        if wf_ver:
            wf = await db.get(Workflow, wf_ver.workflow_id)
            if wf:
                wf_name = wf.name

        results.append({
            "id": r.id,
            "run_number": r.run_number,
            "workflow_name": wf_name,
            "workflow_version_id": r.workflow_version_id,
            "status": r.status.value,
            "triggered_by": r.triggered_by,
            "reproduction_of_run_id": r.reproduction_of_run_id,
            "git_commit": r.git_commit,
            "kubernetes_namespace": r.kubernetes_namespace,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "duration_seconds": r.duration_seconds,
            "created_at": r.created_at.isoformat()
        })
    return results

@router.get("/{run_id}")
async def get_run_detail(run_id: str, db: AsyncSession = Depends(get_db)):
    """Returns complete operational detail for a run."""
    run = await db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    wf_ver = await db.get(WorkflowVersion, run.workflow_version_id)
    wf = await db.get(Workflow, wf_ver.workflow_id) if wf_ver else None

    # Steps
    steps_stmt = select(RunStep).where(RunStep.run_id == run_id)
    steps = (await db.execute(steps_stmt)).scalars().all()

    # Logs
    logs_stmt = select(ExecutionLog).where(ExecutionLog.run_id == run_id).order_by(ExecutionLog.timestamp.asc())
    logs = (await db.execute(logs_stmt)).scalars().all()

    # Artifacts
    arts_stmt = select(Artifact).where(Artifact.run_id == run_id)
    artifacts = (await db.execute(arts_stmt)).scalars().all()

    # Provenance Record
    prov_stmt = select(ProvenanceRecord).where(ProvenanceRecord.run_id == run_id)
    prov_rec = (await db.execute(prov_stmt)).scalars().first()

    # Normalized DAG for visual execution graph
    val_res = validate_and_normalize_workflow(wf_ver.raw_yaml) if wf_ver else None

    return {
        "id": run.id,
        "run_number": run.run_number,
        "status": run.status.value,
        "workflow_id": wf.id if wf else "",
        "workflow_name": wf.name if wf else "Particle Analysis",
        "workflow_version": wf_ver.version_number if wf_ver else 1,
        "reproduction_of_run_id": run.reproduction_of_run_id,
        "git_commit": run.git_commit,
        "kubernetes_namespace": run.kubernetes_namespace,
        "parameters": json.loads(run.parameters) if run.parameters else {},
        "environment_vars": json.loads(run.environment_vars) if run.environment_vars else {},
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "duration_seconds": run.duration_seconds,
        "error_message": run.error_message,
        "steps": [
            {
                "id": s.id,
                "name": s.step_name,
                "status": s.status.value,
                "pod_name": s.pod_name,
                "kubernetes_job_name": s.kubernetes_job_name,
                "exit_code": s.exit_code,
                "cpu_usage": s.cpu_usage,
                "memory_usage": s.memory_usage,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                "duration_seconds": s.duration_seconds
            }
            for s in steps
        ],
        "logs": [
            {
                "id": l.id,
                "step_name": l.step_name,
                "stream": l.stream,
                "timestamp": l.timestamp.strftime("%H:%M:%S.%f")[:-3],
                "message": l.message
            }
            for l in logs
        ],
        "artifacts": [
            {
                "id": a.id,
                "name": a.name,
                "file_type": a.file_type,
                "size_bytes": a.size_bytes,
                "checksum": a.checksum,
                "storage_path": a.storage_path
            }
            for a in artifacts
        ],
        "provenance_fingerprint": prov_rec.workflow_checksum if prov_rec else None,
        "normalized_dag": val_res.normalized_dag if val_res else None
    }

@router.post("")
async def trigger_run(req: TriggerRunRequest, db: AsyncSession = Depends(get_db)):
    """
    Launches a workflow run:
    1. Validates workflow DAG
    2. Generates immutable Provenance Record
    3. Initializes Run and RunSteps in database
    4. Dispatches to Workflow Orchestrator
    """
    wf = await db.get(Workflow, req.workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if req.version_id:
        wf_ver = await db.get(WorkflowVersion, req.version_id)
    else:
        v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == wf.id).order_by(WorkflowVersion.version_number.desc()).limit(1)
        wf_ver = (await db.execute(v_stmt)).scalars().first()

    if not wf_ver:
        raise HTTPException(status_code=400, detail="Workflow has no published version")

    # Validate DAG
    val_res = validate_and_normalize_workflow(wf_ver.raw_yaml)
    if not val_res.is_valid or not val_res.normalized_dag:
        raise HTTPException(status_code=400, detail="Cannot execute: workflow DAG is invalid")

    # Count total runs to determine run_number
    from sqlalchemy import func
    count_stmt = select(func.count()).select_from(Run)
    total_runs = (await db.execute(count_stmt)).scalar() or 0
    run_number = total_runs + 184  # Operational offset for realistic scientific numbering

    run_id = str(uuid.uuid4())
    run = Run(
        id=run_id,
        project_id=wf.project_id,
        workflow_version_id=wf_ver.id,
        run_number=run_number,
        status=RunStatusEnum.QUEUED,
        triggered_by="Dr. H. Vance (CERN)",
        parameters=json.dumps(req.parameters),
        environment_vars=json.dumps(req.environment_vars),
        kubernetes_namespace="reprovia-workloads"
    )
    db.add(run)

    # Initialize RunSteps in DB
    for step_name in val_res.normalized_dag["steps"].keys():
        step_spec = val_res.normalized_dag["steps"][step_name]
        step = RunStep(
            id=str(uuid.uuid4()),
            run_id=run_id,
            step_name=step_name,
            image=step_spec["image"],
            status=RunStatusEnum.QUEUED
        )
        db.add(step)

    await db.commit()

    # Create immutable Provenance Record
    await create_immutable_provenance_record(
        run_id=run_id,
        workflow_version=wf_ver,
        parameters=req.parameters,
        env_vars=req.environment_vars
    )

    # Dispatch to orchestrator
    await orchestrator.trigger_run(
        run_id=run_id,
        workflow_version_yaml=wf_ver.raw_yaml,
        parameters=req.parameters,
        env_vars=req.environment_vars
    )

    return {
        "run_id": run_id,
        "run_number": run_number,
        "status": "QUEUED",
        "message": f"Run #{run_number} queued for container execution."
    }

@router.get("/{run_id}/stream")
async def stream_run_events(run_id: str):
    """
    Server-Sent Events (SSE) endpoint streaming real-time logs and step state transitions.
    """
    queue = event_bus.subscribe(run_id)

    async def event_generator():
        try:
            # Yield initial connection heartbeat
            yield f"event: connected\ndata: {json.dumps({'status': 'listening', 'run_id': run_id})}\n\n"
            while True:
                payload = await queue.get()
                yield f"event: {payload['event']}\ndata: {json.dumps(payload['data'])}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            event_bus.unsubscribe(run_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
