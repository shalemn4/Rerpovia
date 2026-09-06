from abc import ABC, abstractmethod
from typing import Any, AsyncIterator
from pydantic import BaseModel

class StepSubmission(BaseModel):
    run_id: str
    step_name: str
    image: str
    command: str
    env: dict[str, str] = {}
    resources: dict[str, str] = {}
    namespace: str = "reprovia-workloads"
    timeout_seconds: int = 300

class StepStatus(BaseModel):
    step_name: str
    status: str  # "QUEUED", "STARTING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"
    exit_code: int | None = None
    pod_name: str | None = None
    job_name: str | None = None
    cpu_usage: str = "0m"
    memory_usage: str = "0Mi"
    error_message: str | None = None

class Executor(ABC):
    """
    Abstract execution adapter interface.
    Implemented by both MockExecutor (local development) and KubernetesExecutor (cluster production).
    """

    @abstractmethod
    async def submit(self, spec: StepSubmission) -> str:
        """
        Submits a workflow step for execution.
        Returns job_identifier.
        """
        pass

    @abstractmethod
    async def get_status(self, job_identifier: str, namespace: str = "reprovia-workloads") -> StepStatus:
        """
        Polls or retrieves current status of a job.
        """
        pass

    @abstractmethod
    async def get_logs(self, job_identifier: str, namespace: str = "reprovia-workloads", follow: bool = False) -> AsyncIterator[dict]:
        """
        Streams or yields log lines: {"stream": "stdout"|"stderr", "timestamp": str, "message": str}
        """
        pass

    @abstractmethod
    async def cancel(self, job_identifier: str, namespace: str = "reprovia-workloads") -> bool:
        """
        Cancels an ongoing job.
        """
        pass
