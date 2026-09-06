import asyncio
import random
import uuid
from datetime import datetime
from typing import AsyncIterator
from app.execution.interface import Executor, StepSubmission, StepStatus

class MockExecutor(Executor):
    """
    Local mock executor that faithfully simulates Kubernetes Job lifecycle:
    QUEUED -> STARTING -> RUNNING -> COMPLETED
    Generates realistic computational science logs and metrics.
    """

    def __init__(self):
        # In-memory job state tracking: job_id -> job dict
        self._jobs: dict[str, dict] = {}

    async def submit(self, spec: StepSubmission) -> str:
        job_id = f"job-{spec.step_name}-{uuid.uuid4().hex[:8]}"
        pod_name = f"pod-{spec.step_name}-{uuid.uuid4().hex[:6]}"

        self._jobs[job_id] = {
            "spec": spec,
            "job_id": job_id,
            "pod_name": pod_name,
            "status": "STARTING",
            "exit_code": None,
            "started_at": datetime.utcnow(),
            "completed_at": None,
            "cpu_usage": f"{random.randint(180, 750)}m",
            "memory_usage": f"{random.randint(256, 890)}Mi",
            "logs": [],
            "cancelled": False
        }

        # Spawn asynchronous simulation task
        asyncio.create_task(self._simulate_execution(job_id))
        return job_id

    async def _simulate_execution(self, job_id: str):
        job = self._jobs.get(job_id)
        if not job:
            return

        spec: StepSubmission = job["spec"]
        
        # Step 1: STARTING phase (image pull, container init)
        await asyncio.sleep(1.2)
        if job["cancelled"]:
            return

        job["logs"].append({
            "stream": "stdout",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"k8s-node-worker: Pulling container image {spec.image}..."
        })
        job["logs"].append({
            "stream": "stdout",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"k8s-node-worker: Image pulled successfully (digest: sha256:4b9a8c7e{random.randint(1000, 9999)})."
        })

        # Step 2: RUNNING phase
        job["status"] = "RUNNING"
        job["logs"].append({
            "stream": "stdout",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"[REPROVIA-RUNNER] Mounted PVC /data -> hostPath:/var/reprovia/data"
        })
        job["logs"].append({
            "stream": "stdout",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"[EXEC] Spawning process: {spec.command}"
        })

        # Generate realistic domain logs based on step name
        step_lower = spec.step_name.lower()
        if "prep" in step_lower:
            simulated_logs = [
                "Loading raw particle detector event streams from /data/raw/collisions_2026.bin",
                "Parsing 1,250,000 calorimeter hits across 4 detector quadrants...",
                "Filtering detector baseline noise (SNR > 4.5 dB): 98.4% events retained",
                "Normalizing momentum vectors [px, py, pz, E] into standard GeV/c coordinates",
                "Generating preprocessed batch arrays -> /data/preprocessed/events_clean.parquet",
                "Preprocess verification: sha256 checksum calculated successfully."
            ]
        elif "analy" in step_lower or "stat" in step_lower:
            simulated_logs = [
                "Initializing scientific analysis kernels with 8 parallel worker threads...",
                "Computing invariant mass distribution for di-muon candidate pairs...",
                "Fitting relativistic Breit-Wigner resonance curve to invariant mass peaks...",
                "Running Monte Carlo confidence interval estimation (10,000 iterations)...",
                "Observed Higgs candidate resonance at 125.09 ± 0.24 GeV with 5.2-sigma significance",
                "Statistical convergence achieved. Writing analysis matrices to /results/analysis.csv"
            ]
        elif "vis" in step_lower:
            simulated_logs = [
                "Reading resonance parameters from /results/analysis.csv...",
                "Rendering publication-ready invariant mass histogram (matplotlib/seaborn backend)...",
                "Generating 3D spatial collision track diagram (CERN-standard geometry)...",
                "Exporting vector graphics: /results/histogram.png and /results/report.pdf",
                "Artifact generation completed: 4 files registered in artifact store."
            ]
        else:
            simulated_logs = [
                f"Executing command: {spec.command}",
                "Allocating computational scratch memory...",
                "Iterating algorithm convergence criteria...",
                "Pipeline step execution succeeded without warnings."
            ]

        for log_text in simulated_logs:
            await asyncio.sleep(random.uniform(0.8, 1.4))
            if job["cancelled"]:
                return
            job["logs"].append({
                "stream": "stdout",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "message": f"[{spec.step_name}] {log_text}"
            })

        # Step 3: COMPLETED phase
        await asyncio.sleep(0.5)
        if job["cancelled"]:
            return

        job["status"] = "COMPLETED"
        job["exit_code"] = 0
        job["completed_at"] = datetime.utcnow()
        job["logs"].append({
            "stream": "stdout",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"k8s-pod: Container exited with status 0 (Success). Cleaning up pod."
        })

    async def get_status(self, job_identifier: str, namespace: str = "reprovia-workloads") -> StepStatus:
        job = self._jobs.get(job_identifier)
        if not job:
            return StepStatus(
                step_name="unknown",
                status="FAILED",
                error_message=f"Job {job_identifier} not found"
            )

        return StepStatus(
            step_name=job["spec"].step_name,
            status=job["status"],
            exit_code=job["exit_code"],
            pod_name=job["pod_name"],
            job_name=job_id_safe(job_identifier),
            cpu_usage=job["cpu_usage"],
            memory_usage=job["memory_usage"],
            error_message=None if job["status"] != "FAILED" else "Execution error"
        )

    async def get_logs(self, job_identifier: str, namespace: str = "reprovia-workloads", follow: bool = False) -> AsyncIterator[dict]:
        job = self._jobs.get(job_identifier)
        if not job:
            return

        yielded_count = 0
        while True:
            current_logs = job["logs"]
            while yielded_count < len(current_logs):
                yield current_logs[yielded_count]
                yielded_count += 1

            if job["status"] in ["COMPLETED", "FAILED", "CANCELLED"] or not follow:
                break
            await asyncio.sleep(0.5)

    async def cancel(self, job_identifier: str, namespace: str = "reprovia-workloads") -> bool:
        job = self._jobs.get(job_identifier)
        if not job:
            return False
        job["cancelled"] = True
        job["status"] = "CANCELLED"
        job["exit_code"] = 137
        job["logs"].append({
            "stream": "stderr",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": "SIGTERM received. Execution cancelled by user."
        })
        return True

def job_id_safe(identifier: str) -> str:
    return identifier.replace("_", "-")
