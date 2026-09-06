from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.artifact import Artifact
from app.storage.artifact_store import artifact_store

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])

@router.get("/{artifact_id}")
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    art = await db.get(Artifact, artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")

    content = await artifact_store.get_artifact(art.storage_path)
    
    # Try decoding text for inline display
    text_content = None
    if art.file_type in ["json", "csv", "svg", "txt", "log"]:
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
async def get_raw_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    art = await db.get(Artifact, artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")

    content = await artifact_store.get_artifact(art.storage_path)
    media_types = {
        "json": "application/json",
        "csv": "text/csv",
        "svg": "image/svg+xml",
        "png": "image/png",
        "pdf": "application/pdf"
    }
    media_type = media_types.get(art.file_type, "application/octet-stream")
    return Response(content=content, media_type=media_type)
