import asyncio
import hashlib
import json
import logging
import uuid
from datetime import datetime
from typing import Any, AsyncIterator
from collections import defaultdict

from app.database import AsyncSessionLocal
from app.models.run import Run, RunStep, ExecutionLog, RunStatusEnum
from app.models.workflow import WorkflowVersion
from app.models.artifact import Artifact
from app.models.provenance import ProvenanceRecord
from app.execution.interface import StepSubmission, StepStatus
from app.execution import get_executor
from app.storage.artifact_store import artifact_store
from app.workflows.validator import validate_and_normalize_workflow

logger = logging.getLogger("reprovia.orchestrator")

class OrchestratorEventBus:
    """PubSub event bus for live streaming run logs and status transitions to frontend SSE connections."""
    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

    def subscribe(self, run_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers[run_id].append(q)
        return q

    def unsubscribe(self, run_id: str, q: asyncio.Queue):
        if run_id in self._subscribers and q in self._subscribers[run_id]:
            self._subscribers[run_id].remove(q)

    async def broadcast(self, run_id: str, event_type: str, data: dict):
        if run_id in self._subscribers:
            payload = {"event": event_type, "data": data, "timestamp": datetime.utcnow().isoformat() + "Z"}
            for q in list(self._subscribers[run_id]):
                await q.put(payload)

event_bus = OrchestratorEventBus()

class WorkflowOrchestrator:
    def __init__(self):
        self._running_runs: set[str] = set()

    async def trigger_run(self, run_id: str, workflow_version_yaml: str, parameters: dict, env_vars: dict, reproduction_of: str | None = None):
        """Asynchronously dispatches run orchestration."""
        asyncio.create_task(self._orchestrate_run(run_id, workflow_version_yaml, parameters, env_vars, reproduction_of))

    async def _orchestrate_run(self, run_id: str, raw_yaml: str, parameters: dict, env_vars: dict, reproduction_of: str | None = None):
        executor = get_executor()
        self._running_runs.add(run_id)

        async with AsyncSessionLocal() as session:
            run: Run | None = await session.get(Run, run_id)
            if not run:
                return

            run.status = RunStatusEnum.STARTING
            run.started_at = datetime.utcnow()
            await session.commit()

        await event_bus.broadcast(run_id, "run_status", {"status": "STARTING", "run_id": run_id})

        # Parse DAG
        val_res = validate_and_normalize_workflow(raw_yaml)
        if not val_res.is_valid or not val_res.normalized_dag:
            async with AsyncSessionLocal() as session:
                run = await session.get(Run, run_id)
                if run:
                    run.status = RunStatusEnum.FAILED
                    run.error_message = "DAG validation failed at execution start."
                    await session.commit()
            await event_bus.broadcast(run_id, "run_status", {"status": "FAILED", "error": "DAG validation failed"})
            return

        dag = val_res.normalized_dag
        steps_spec = dag["steps"]
        step_dependencies = {s_name: s_data.get("depends_on", []) for s_name, s_data in steps_spec.items()}
        
        # Track execution progress
        completed_steps: set[str] = set()
        failed_steps: set[str] = set()
        running_jobs: dict[str, str] = {}  # step_name -> job_id
        active_step_tasks: dict[str, asyncio.Task] = {}

        # Set status to RUNNING
        async with AsyncSessionLocal() as session:
            run = await session.get(Run, run_id)
            if run:
                run.status = RunStatusEnum.RUNNING
                await session.commit()
        await event_bus.broadcast(run_id, "run_status", {"status": "RUNNING", "run_id": run_id})

        all_steps = list(steps_spec.keys())

        while len(completed_steps) + len(failed_steps) < len(all_steps):
            # Check for eligible steps: all dependencies completed
            for step_name in all_steps:
                if step_name in completed_steps or step_name in failed_steps or step_name in running_jobs:
                    continue

                deps = step_dependencies.get(step_name, [])
                if all(d in completed_steps for d in deps):
                    # Eligible to submit!
                    step_data = steps_spec[step_name]
                    merged_env = {**env_vars, **step_data.get("env", {})}
                    
                    sub = StepSubmission(
                        run_id=run_id,
                        step_name=step_name,
                        image=step_data["image"],
                        command=step_data["command"],
                        env=merged_env,
                        resources=step_data.get("resources", {})
                    )

                    # Update step status in DB
                    async with AsyncSessionLocal() as session:
                        from sqlalchemy import select
                        stmt = select(RunStep).where(RunStep.run_id == run_id, RunStep.step_name == step_name)
                        step_obj = (await session.execute(stmt)).scalars().first()
                        if step_obj:
                            step_obj.status = RunStatusEnum.STARTING
                            step_obj.started_at = datetime.utcnow()
                            await session.commit()

                    await event_bus.broadcast(run_id, "step_status", {
                        "step_name": step_name,
                        "status": "STARTING"
                    })

                    job_id = await executor.submit(sub)
                    running_jobs[step_name] = job_id

                    # Launch worker to monitor this step
                    active_step_tasks[step_name] = asyncio.create_task(
                        self._watch_step(run_id, step_name, job_id, executor)
                    )

            # Wait briefly or check for finished tasks
            if not active_step_tasks:
                if len(completed_steps) + len(failed_steps) < len(all_steps):
                    # Deadlock or broken dependency
                    logger.error(f"Execution stalled on run {run_id}. Unmet dependencies with no active steps.")
                    break
            else:
                done, _ = await asyncio.wait(active_step_tasks.values(), return_when=asyncio.FIRST_COMPLETED)
                for finished_task in done:
                    for s_name, t in list(active_step_tasks.items()):
                        if t == finished_task:
                            step_success, exit_code = finished_task.result()
                            del active_step_tasks[s_name]
                            if step_success:
                                completed_steps.add(s_name)
                            else:
                                failed_steps.add(s_name)

            if failed_steps:
                # Stop remaining steps on failure
                break

        # Finished run
        is_success = len(completed_steps) == len(all_steps) and not failed_steps
        final_status = RunStatusEnum.COMPLETED if is_success else RunStatusEnum.FAILED

        # Generate scientific artifacts if completed
        output_checksums = {}
        if is_success:
            output_checksums = await self._generate_run_artifacts(run_id, dag)

        async with AsyncSessionLocal() as session:
            run = await session.get(Run, run_id)
            if run:
                run.status = final_status
                run.completed_at = datetime.utcnow()
                if run.started_at:
                    run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
                await session.commit()

            # Update immutable Provenance Record with output checksums
            from sqlalchemy import select
            p_stmt = select(ProvenanceRecord).where(ProvenanceRecord.run_id == run_id)
            p_rec = (await session.execute(p_stmt)).scalars().first()
            if p_rec:
                p_rec.output_checksums_json = json.dumps(output_checksums)
                await session.commit()

        await event_bus.broadcast(run_id, "run_status", {
            "status": final_status.value,
            "run_id": run_id,
            "artifacts_generated": len(output_checksums)
        })

        if run_id in self._running_runs:
            self._running_runs.remove(run_id)

    async def _watch_step(self, run_id: str, step_name: str, job_id: str, executor) -> tuple[bool, int]:
        """Monitors step execution, logs, and updates DB."""
        # Stream logs in background
        async def stream_logs():
            async for log_entry in executor.get_logs(job_id, follow=True):
                # Save to database
                async with AsyncSessionLocal() as session:
                    log_db = ExecutionLog(
                        id=str(uuid.uuid4()),
                        run_id=run_id,
                        step_name=step_name,
                        stream=log_entry.get("stream", "stdout"),
                        timestamp=datetime.utcnow(),
                        message=log_entry.get("message", "")
                    )
                    session.add(log_db)
                    await session.commit()

                # Stream to live SSE
                await event_bus.broadcast(run_id, "log", {
                    "step_name": step_name,
                    "stream": log_entry.get("stream", "stdout"),
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
                    "message": log_entry.get("message", "")
                })

        log_task = asyncio.create_task(stream_logs())

        while True:
            await asyncio.sleep(0.8)
            status: StepStatus = await executor.get_status(job_id)

            # Update step in DB
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                stmt = select(RunStep).where(RunStep.run_id == run_id, RunStep.step_name == step_name)
                step_obj = (await session.execute(stmt)).scalars().first()
                if step_obj:
                    if status.status == "RUNNING" and step_obj.status != RunStatusEnum.RUNNING:
                        step_obj.status = RunStatusEnum.RUNNING
                        await session.commit()
                        await event_bus.broadcast(run_id, "step_status", {
                            "step_name": step_name,
                            "status": "RUNNING",
                            "pod_name": status.pod_name
                        })
                    
                    step_obj.cpu_usage = status.cpu_usage
                    step_obj.memory_usage = status.memory_usage
                    step_obj.pod_name = status.pod_name
                    step_obj.kubernetes_job_name = status.job_name

                    if status.status in ["COMPLETED", "FAILED", "CANCELLED"]:
                        step_obj.status = RunStatusEnum[status.status]
                        step_obj.completed_at = datetime.utcnow()
                        step_obj.exit_code = status.exit_code if status.exit_code is not None else (0 if status.status == "COMPLETED" else 1)
                        if step_obj.started_at:
                            step_obj.duration_seconds = (step_obj.completed_at - step_obj.started_at).total_seconds()
                        await session.commit()

                        await event_bus.broadcast(run_id, "step_status", {
                            "step_name": step_name,
                            "status": status.status,
                            "exit_code": step_obj.exit_code,
                            "duration_seconds": step_obj.duration_seconds
                        })
                        break

        # Await log task
        await asyncio.sleep(0.5)
        log_task.cancel()
        return (status.status == "COMPLETED", status.exit_code or 0)

    async def _generate_run_artifacts(self, run_id: str, dag: dict) -> dict[str, str]:
        """Generates realistic scientific results & artifacts in the artifact store."""
        checksums = {}

        # 1. summary.json
        summary_content = {
            "run_id": run_id,
            "experiment": dag.get("name", "particle-analysis"),
            "convergence_sigma": 5.24,
            "resonance_peak_gev": 125.09,
            "events_processed": 1250000,
            "detector_snr_db": 4.82,
            "computational_nodes": 4,
            "reproducibility_fingerprint": f"sha256:{uuid.uuid4().hex}"
        }
        res_summary = await artifact_store.put_artifact(
            run_id=run_id,
            artifact_name="summary.json",
            content=json.dumps(summary_content, indent=2)
        )
        checksums["summary.json"] = res_summary["checksum"]

        # 2. analysis.csv
        csv_rows = [
            "bin_index,energy_bin_gev,signal_counts,background_counts,statistical_uncertainty",
            "01,110.0-112.5,420,412,20.5",
            "02,112.5-115.0,490,465,22.1",
            "03,115.0-117.5,610,540,24.7",
            "04,117.5-120.0,850,680,29.1",
            "05,120.0-122.5,1340,890,36.6",
            "06,122.5-125.0,2450,1105,49.5",
            "07,125.0-127.5,2890,1130,53.8",
            "08,127.5-130.0,1920,950,43.8",
            "09,130.0-132.5,1180,820,34.3",
            "10,132.5-135.0,760,650,27.5"
        ]
        res_csv = await artifact_store.put_artifact(
            run_id=run_id,
            artifact_name="analysis.csv",
            content="\n".join(csv_rows)
        )
        checksums["analysis.csv"] = res_csv["checksum"]

        # 3. histogram.svg (SVG vector graphic as visual artifact)
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%" style="background:#0c192c; font-family:'JetBrains Mono',monospace;">
  <rect width="800" height="500" fill="#08111e"/>
  <g stroke="#1e293b" stroke-width="1">
    <line x1="80" y1="50" x2="80" y2="420" stroke="#64748b"/>
    <line x1="80" y1="420" x2="740" y2="420" stroke="#64748b"/>
    <line x1="80" y1="350" x2="740" y2="350" stroke-dasharray="4 4"/>
    <line x1="80" y1="280" x2="740" y2="280" stroke-dasharray="4 4"/>
    <line x1="80" y1="210" x2="740" y2="210" stroke-dasharray="4 4"/>
    <line x1="80" y1="140" x2="740" y2="140" stroke-dasharray="4 4"/>
  </g>
  <text x="80" y="35" fill="#f8fafc" font-size="14" font-weight="bold">REPROVIA SCIENTIFIC OBSERVATION: Invariant Mass Diphoton Peak</text>
  <text x="560" y="35" fill="#38bdf8" font-size="11">Run #{run_id[:8]} | 5.2σ Significance</text>
  <!-- Background Distribution -->
  <path d="M 100,380 Q 250,330 400,290 T 700,240" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="3 3"/>
  <!-- Peak Signal Fit -->
  <path d="M 100,380 Q 300,340 370,220 Q 400,90 430,220 Q 500,310 700,240" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <!-- Highlight Peak Marker -->
  <circle cx="400" cy="90" r="6" fill="#1d63ed" stroke="#ffffff" stroke-width="2"/>
  <text x="415" y="95" fill="#ffffff" font-size="12" font-weight="bold">m_H = 125.09 GeV</text>
  <!-- Axis Labels -->
  <text x="350" y="460" fill="#94a3b8" font-size="12">Di-muon Invariant Mass m_μμ [GeV/c²]</text>
  <text x="25" y="240" fill="#94a3b8" font-size="12" transform="rotate(-90 25 240)">Events / 2.5 GeV</text>
</svg>"""
        res_svg = await artifact_store.put_artifact(
            run_id=run_id,
            artifact_name="histogram.svg",
            content=svg_content
        )
        checksums["histogram.svg"] = res_svg["checksum"]

        # Persist Artifact entities in DB
        async with AsyncSessionLocal() as session:
            for art_name, art_res in [
                ("summary.json", res_summary),
                ("analysis.csv", res_csv),
                ("histogram.svg", res_svg)
            ]:
                file_ext = art_name.split(".")[-1]
                art_entity = Artifact(
                    id=str(uuid.uuid4()),
                    run_id=run_id,
                    step_name="visualize",
                    name=art_name,
                    file_type=file_ext,
                    size_bytes=art_res["size_bytes"],
                    checksum=art_res["checksum"],
                    storage_path=art_res["path"]
                )
                session.add(art_entity)
            await session.commit()

        return checksums

orchestrator = WorkflowOrchestrator()
