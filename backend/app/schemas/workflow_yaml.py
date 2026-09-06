from typing import Any
from pydantic import BaseModel, Field, field_validator
import re

class ResourceRequirements(BaseModel):
    cpu_request: str = "500m"
    memory_request: str = "512Mi"
    cpu_limit: str = "1000m"
    memory_limit: str = "1Gi"

    @field_validator("cpu_request", "cpu_limit")
    @classmethod
    def validate_cpu(cls, v: str) -> str:
        if not re.match(r"^\d+(m)?$", v):
            raise ValueError(f"Invalid CPU format: {v}. Must be like '500m' or '2'")
        return v

    @field_validator("memory_request", "memory_limit")
    @classmethod
    def validate_memory(cls, v: str) -> str:
        if not re.match(r"^\d+(Mi|Gi|Ki|M|G)?$", v):
            raise ValueError(f"Invalid Memory format: {v}. Must be like '512Mi' or '2Gi'")
        return v

class WorkflowStepSpec(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    image: str = Field(..., min_length=1)
    command: str = Field(...)
    depends_on: list[str] = Field(default_factory=list)
    inputs: dict[str, Any] = Field(default_factory=dict)
    outputs: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)
    resources: ResourceRequirements = Field(default_factory=ResourceRequirements)

    @field_validator("name")
    @classmethod
    def validate_step_name(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError(f"Step name '{v}' contains invalid characters. Use alphanumeric, dashes, or underscores.")
        return v

class WorkflowSpec(BaseModel):
    version: str = "1.0"
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    inputs: dict[str, Any] = Field(default_factory=dict)
    steps: list[WorkflowStepSpec] = Field(..., min_length=1)
    outputs: list[str] = Field(default_factory=list)

class ValidationErrorDetail(BaseModel):
    loc: list[str | int]
    msg: str
    type: str

class ValidationResult(BaseModel):
    is_valid: bool
    errors: list[ValidationErrorDetail] = Field(default_factory=list)
    normalized_dag: dict[str, Any] | None = None
