from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class ProvenanceRecord(Base):
    """
    Immutable Provenance Record locked at run creation.
    Captures complete cryptographic fingerprints of all ingredients.
    """
    __tablename__ = "provenance_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Immutable fingerprints
    workflow_id: Mapped[str] = mapped_column(String(36), nullable=False)
    workflow_version: Mapped[int] = mapped_column(nullable=False)
    workflow_checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    
    git_commit: Mapped[str] = mapped_column(String(40), nullable=False)
    
    dataset_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    dataset_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dataset_checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    
    container_images_json: Mapped[str] = mapped_column(Text, nullable=False)  # [{image, digest, step}]
    parameters_json: Mapped[str] = mapped_column(Text, nullable=False)
    environment_vars_json: Mapped[str] = mapped_column(Text, nullable=False)
    kubernetes_spec_json: Mapped[str] = mapped_column(Text, nullable=False)
    
    output_checksums_json: Mapped[str] = mapped_column(Text, default="{}")  # Populated when run finishes
    is_immutable: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
