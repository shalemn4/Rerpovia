import hashlib
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.dataset import Dataset, DatasetVersion

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

class CreateDatasetRequest(BaseModel):
    project_id: str
    name: str
    description: str = ""
    owner: str = "Dr. H. Vance (CERN)"
    tags: list[str] = ["cern", "atlas", "open-data"]
    version_tag: str = "v1.0"
    file_format: str = "binary/parquet"
    size_bytes: int = 1482000000  # ~1.48 GB

@router.get("")
async def list_datasets(project_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Lists research datasets with versions and checksums."""
    stmt = select(Dataset)
    if project_id:
        stmt = stmt.where(Dataset.project_id == project_id)
    datasets = (await db.execute(stmt)).scalars().all()

    results = []
    for ds in datasets:
        v_stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == ds.id).order_by(DatasetVersion.created_at.desc())
        versions = (await db.execute(v_stmt)).scalars().all()
        results.append({
            "id": ds.id,
            "name": ds.name,
            "slug": ds.slug,
            "description": ds.description,
            "owner": ds.owner,
            "tags": json.loads(ds.tags) if ds.tags else [],
            "versions_count": len(versions),
            "latest_version": versions[0].version_tag if versions else "v1.0",
            "checksum": versions[0].checksum if versions else "",
            "size_bytes": versions[0].size_bytes if versions else 0,
            "created_at": ds.created_at.isoformat()
        })
    return results

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, db: AsyncSession = Depends(get_db)):
    ds = await db.get(Dataset, dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    v_stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == ds.id).order_by(DatasetVersion.created_at.desc())
    versions = (await db.execute(v_stmt)).scalars().all()

    return {
        "id": ds.id,
        "name": ds.name,
        "slug": ds.slug,
        "description": ds.description,
        "owner": ds.owner,
        "tags": json.loads(ds.tags) if ds.tags else [],
        "versions": [
            {
                "id": v.id,
                "version_tag": v.version_tag,
                "checksum": v.checksum,
                "size_bytes": v.size_bytes,
                "file_format": v.file_format,
                "storage_path": v.storage_path,
                "created_at": v.created_at.isoformat()
            }
            for v in versions
        ]
    }
