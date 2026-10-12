import os
import hashlib
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import Response, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models.dataset import Dataset, DatasetVersion

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

class CreateDatasetRequest(BaseModel):
    project_id: str = "proj-particle-physics"
    name: str
    description: str = ""
    owner: str = "Dr. H. Vance (CERN)"
    tags: list[str] = ["cern", "open-data"]
    version_tag: str = "v1.0"
    file_format: str = "binary/parquet"
    size_bytes: int = 1048576  # Default ~1 MB if mock
    storage_path: str = ""
    checksum: str = ""

@router.get("")
async def list_datasets(project_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Lists research datasets with versions and checksums."""
    stmt = select(Dataset).order_by(Dataset.created_at.desc())
    if project_id:
        stmt = stmt.where(Dataset.project_id == project_id)
    datasets = (await db.execute(stmt)).scalars().all()

    results = []
    for ds in datasets:
        v_stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == ds.id).order_by(DatasetVersion.created_at.desc())
        versions = (await db.execute(v_stmt)).scalars().all()
        results.append({
            "id": ds.id,
            "project_id": ds.project_id,
            "name": ds.name,
            "slug": ds.slug,
            "description": ds.description,
            "owner": ds.owner,
            "tags": json.loads(ds.tags) if ds.tags else [],
            "versions_count": len(versions),
            "latest_version": versions[0].version_tag if versions else "v1.0",
            "checksum": versions[0].checksum if versions else "",
            "size_bytes": versions[0].size_bytes if versions else 0,
            "storage_path": versions[0].storage_path if versions else "",
            "file_format": versions[0].file_format if versions else "binary/root",
            "created_at": ds.created_at.isoformat()
        })
    return results

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves single dataset metadata and its full version history."""
    ds = await db.get(Dataset, dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    v_stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == ds.id).order_by(DatasetVersion.created_at.desc())
    versions = (await db.execute(v_stmt)).scalars().all()

    return {
        "id": ds.id,
        "project_id": ds.project_id,
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
                "lineage_metadata": json.loads(v.lineage_metadata) if v.lineage_metadata else {},
                "created_at": v.created_at.isoformat()
            }
            for v in versions
        ]
    }

@router.post("")
async def create_dataset(req: CreateDatasetRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new registered dataset with initial version metadata."""
    ds_id = f"ds-{uuid.uuid4().hex[:8]}"
    slug = req.name.lower().replace(" ", "-")

    ds = Dataset(
        id=ds_id,
        project_id=req.project_id,
        name=req.name,
        slug=slug,
        description=req.description,
        owner=req.owner,
        tags=json.dumps(req.tags)
    )
    db.add(ds)

    # Compute default checksum if none provided
    checksum = req.checksum or hashlib.sha256(f"{req.name}-{req.version_tag}-{datetime.utcnow().isoformat()}".encode()).hexdigest()
    storage_path = req.storage_path or f"/data/datasets/{slug}_{req.version_tag}.bin"

    version = DatasetVersion(
        id=f"dsv-{uuid.uuid4().hex[:8]}",
        dataset_id=ds_id,
        version_tag=req.version_tag,
        checksum=checksum,
        size_bytes=req.size_bytes,
        storage_path=storage_path,
        file_format=req.file_format,
        lineage_metadata=json.dumps({
            "source": "REPROVIA Dataset Registry",
            "registered_by": req.owner,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
    )
    db.add(version)
    await db.commit()

    return {
        "id": ds.id,
        "name": ds.name,
        "slug": ds.slug,
        "latest_version": version.version_tag,
        "checksum": version.checksum,
        "size_bytes": version.size_bytes,
        "created_at": ds.created_at.isoformat()
    }

@router.post("/upload")
async def upload_dataset_file(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(default=""),
    project_id: str = Form(default="proj-particle-physics"),
    version_tag: str = Form(default="v1.0"),
    owner: str = Form(default="Dr. H. Vance (CERN)"),
    tags: str = Form(default="[\"cern\", \"uploaded\"]"),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts physical file upload, calculates exact SHA-256 checksum,
    persists file to disk, and registers dataset and version.
    """
    datasets_dir = os.path.join(os.path.abspath(settings.ARTIFACT_STORAGE_PATH), "datasets")
    os.makedirs(datasets_dir, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_dest = os.path.join(datasets_dir, safe_filename)

    hasher = hashlib.sha256()
    size_bytes = 0

    with open(file_dest, "wb") as out_f:
        while chunk := await file.read(1024 * 64):
            hasher.update(chunk)
            out_f.write(chunk)
            size_bytes += len(chunk)

    checksum = hasher.hexdigest()
    
    # Check if format can be inferred
    ext = os.path.splitext(file.filename)[1].lstrip(".").lower() or "bin"
    file_format = f"file/{ext}"

    # Parse tags
    try:
        parsed_tags = json.loads(tags)
        if not isinstance(parsed_tags, list):
            parsed_tags = [str(tags)]
    except Exception:
        parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    # Create dataset entry
    ds_id = f"ds-{uuid.uuid4().hex[:8]}"
    slug = name.lower().replace(" ", "-")

    ds = Dataset(
        id=ds_id,
        project_id=project_id,
        name=name,
        slug=slug,
        description=description,
        owner=owner,
        tags=json.dumps(parsed_tags)
    )
    db.add(ds)

    version = DatasetVersion(
        id=f"dsv-{uuid.uuid4().hex[:8]}",
        dataset_id=ds_id,
        version_tag=version_tag,
        checksum=checksum,
        size_bytes=size_bytes,
        storage_path=os.path.relpath(file_dest, settings.ARTIFACT_STORAGE_PATH).replace("\\", "/"),
        file_format=file_format,
        lineage_metadata=json.dumps({
            "source": "Physical File Upload",
            "original_filename": file.filename,
            "uploaded_at": datetime.utcnow().isoformat() + "Z"
        })
    )
    db.add(version)
    await db.commit()

    return {
        "id": ds.id,
        "name": ds.name,
        "latest_version": version.version_tag,
        "checksum": version.checksum,
        "size_bytes": version.size_bytes,
        "filename": file.filename,
        "storage_path": version.storage_path
    }

@router.get("/{dataset_id}/download")
async def download_dataset(dataset_id: str, db: AsyncSession = Depends(get_db)):
    """Downloads the latest version file for a dataset."""
    ds = await db.get(Dataset, dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    v_stmt = select(DatasetVersion).where(DatasetVersion.dataset_id == ds.id).order_by(DatasetVersion.created_at.desc())
    latest_ver = (await db.execute(v_stmt)).scalars().first()
    if not latest_ver:
        raise HTTPException(status_code=404, detail="No versions found for dataset")

    full_path = os.path.join(os.path.abspath(settings.ARTIFACT_STORAGE_PATH), latest_ver.storage_path)
    if not os.path.exists(full_path):
        # Generate on-demand mock content if simulated
        content = f"# REPROVIA Dataset: {ds.name}\n# Version: {latest_ver.version_tag}\n# SHA256: {latest_ver.checksum}\n# Size: {latest_ver.size_bytes} bytes\n".encode("utf-8")
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{ds.slug}_{latest_ver.version_tag}.txt"'}
        )

    return FileResponse(
        path=full_path,
        filename=f"{ds.slug}_{latest_ver.version_tag}.bin",
        media_type="application/octet-stream"
    )
