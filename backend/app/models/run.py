import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float, Text, Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class RunStatusEnum(str, enum.Enum):
    QUEUED = "QUEUED"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    workflow_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_versions.id", ondelete="CASCADE"), nullable=False)
    run_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[RunStatusEnum] = mapped_column(SqlEnum(RunStatusEnum), default=RunStatusEnum.QUEUED, nullable=False)
    triggered_by: Mapped[str] = mapped_column(String(255), default="user")
    reproduction_of_run_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("runs.id"), nullable=True)
    git_commit: Mapped[str] = mapped_column(String(40), default="c8a91f3")
    kubernetes_namespace: Mapped[str] = mapped_column(String(100), default="reprovia-workloads")
    parameters: Mapped[str] = mapped_column(Text, default="{}")  # JSON
    environment_vars: Mapped[str] = mapped_column(Text, default="{}")  # JSON
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    steps: Mapped[list["RunStep"]] = relationship(back_populates="run", cascade="all, delete-orphan")
    logs: Mapped[list["ExecutionLog"]] = relationship(back_populates="run", cascade="all, delete-orphan")
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="run", cascade="all, delete-orphan")

class RunStep(Base):
    __tablename__ = "run_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    step_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[RunStatusEnum] = mapped_column(SqlEnum(RunStatusEnum), default=RunStatusEnum.QUEUED, nullable=False)
    pod_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    kubernetes_job_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image: Mapped[str] = mapped_column(String(255), default="")
    image_digest: Mapped[str] = mapped_column(String(71), default="")  # sha256:...
    exit_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cpu_usage: Mapped[str | None] = mapped_column(String(50), default="0m")
    memory_usage: Mapped[str | None] = mapped_column(String(50), default="0Mi")
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    run: Mapped["Run"] = relationship(back_populates="steps")

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    step_name: Mapped[str] = mapped_column(String(100), nullable=False)
    stream: Mapped[str] = mapped_column(String(10), default="stdout")  # stdout or stderr
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    run: Mapped["Run"] = relationship(back_populates="logs")
