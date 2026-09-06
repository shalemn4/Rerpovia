from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Artifact(Base):
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    step_name: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "csv", "json", "png", "pdf", "txt"
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped["Run"] = relationship("Run", back_populates="artifacts")
