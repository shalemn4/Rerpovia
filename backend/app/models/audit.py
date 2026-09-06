from datetime import datetime
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "WORKFLOW_EXECUTE", "RUN_REPRODUCE"
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(36), nullable=False)
    details: Mapped[str] = mapped_column(Text, default="{}")
    ip_address: Mapped[str] = mapped_column(String(45), default="127.0.0.1")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
