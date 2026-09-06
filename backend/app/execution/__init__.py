from app.config import settings
from app.execution.interface import Executor, StepSubmission, StepStatus
from app.execution.mock_executor import MockExecutor
from app.execution.kubernetes_executor import KubernetesExecutor

_executor_instance: Executor | None = None

def get_executor() -> Executor:
    global _executor_instance
    if _executor_instance is None:
        if settings.EXECUTION_MODE == "kubernetes":
            _executor_instance = KubernetesExecutor()
        else:
            _executor_instance = MockExecutor()
    return _executor_instance

__all__ = ["Executor", "StepSubmission", "StepStatus", "get_executor", "MockExecutor", "KubernetesExecutor"]
