import json
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[str] = mapped_column(String(255), default="[]")  # JSON array
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions: Mapped[list["WorkflowVersion"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")

class WorkflowVersion(Base):
    __tablename__ = "workflow_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    raw_yaml: Mapped[str] = mapped_column(Text, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA256 of YAML
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    workflow: Mapped["Workflow"] = relationship(back_populates="versions")
    steps: Mapped[list["WorkflowStep"]] = relationship(back_populates="version", cascade="all, delete-orphan")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflow_versions.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    image: Mapped[str] = mapped_column(String(255), nullable=False)
    command: Mapped[str] = mapped_column(String(1000), nullable=False)
    depends_on: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of step names
    inputs: Mapped[str] = mapped_column(Text, default="{}")      # JSON dict
    outputs: Mapped[str] = mapped_column(Text, default="[]")     # JSON list of output paths
    env_vars: Mapped[str] = mapped_column(Text, default="{}")    # JSON dict
    cpu_request: Mapped[str] = mapped_column(String(50), default="500m")
    memory_request: Mapped[str] = mapped_column(String(50), default="512Mi")
    cpu_limit: Mapped[str] = mapped_column(String(50), default="1000m")
    memory_limit: Mapped[str] = mapped_column(String(50), default="1Gi")

    version: Mapped["WorkflowVersion"] = relationship(back_populates="steps")
