from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.artifact import Artifact
from app.models.run import Run
from app.storage.artifact_store import artifact_store

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])

@router.get("")
async def list_artifacts(
    run_id: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists output artifacts produced by computational runs.
    Supports filtering by run_id.
    """
    stmt = select(Artifact, Run).outerjoin(Run, Artifact.run_id == Run.id).order_by(Artifact.created_at.desc()).limit(limit)
    if run_id:
        stmt = stmt.where(Artifact.run_id == run_id)
        
    result = await db.execute(stmt)
    rows = result.all()

    artifacts_list = []
    for art, run in rows:
        artifacts_list.append({
            "id": art.id,
            "run_id": art.run_id,
            "run_number": run.run_number if run else None,
            "step_name": art.step_name,
            "name": art.name,
            "file_type": art.file_type,
            "size_bytes": art.size_bytes,
            "checksum": art.checksum,
            "storage_path": art.storage_path,
            "created_at": art.created_at.isoformat()
        })
    return artifacts_list

@router.get("/{artifact_id}")
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    art = await db.get(Artifact, artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")

    content = b""
    try:
        content = await artifact_store.get_artifact(art.storage_path)
    except Exception:
        content = b""
    
    # Try decoding text for inline display
    text_content = None
    if art.file_type in ["json", "csv", "svg", "txt", "log", "tsv"]:
        try:
            text_content = content.decode("utf-8")
        except Exception:
            text_content = None

    return {
        "id": art.id,
        "run_id": art.run_id,
        "step_name": art.step_name,
        "name": art.name,
        "file_type": art.file_type,
        "size_bytes": art.size_bytes,
        "checksum": art.checksum,
        "storage_path": art.storage_path,
        "preview_text": text_content,
        "created_at": art.created_at.isoformat()
    }

@router.get("/{artifact_id}/raw")
async def get_raw_artifact(
    artifact_id: str,
    download: bool = Query(default=False),
    db: AsyncSession = Depends(get_db)
):
    art = await db.get(Artifact, artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")

    try:
        content = await artifact_store.get_artifact(art.storage_path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Artifact file not found in storage")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    media_types = {
        "json": "application/json",
        "csv": "text/csv",
        "svg": "image/svg+xml",
        "png": "image/png",
        "pdf": "application/pdf",
        "txt": "text/plain",
        "tsv": "text/tab-separated-values"
    }
    media_type = media_types.get(art.file_type, "application/octet-stream")
    
    disposition_type = "attachment" if download else "inline"
    headers = {
        "Content-Disposition": f'{disposition_type}; filename="{art.name}"'
    }

    return Response(content=content, media_type=media_type, headers=headers)
