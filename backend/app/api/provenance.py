from fastapi import APIRouter, HTTPException
from app.provenance.builder import get_provenance_graph

router = APIRouter(prefix="/api/provenance", tags=["provenance"])

@router.get("/{run_id}/graph")
async def get_run_provenance_graph(run_id: str):
    """
    Returns complete Provenance Graph nodes and edges for spatial/3D visualization:
    Dataset -> Workflow -> Code -> Containers -> Kubernetes -> Execution -> Artifacts
    """
    graph_data = await get_provenance_graph(run_id)
    if not graph_data.get("nodes"):
        raise HTTPException(status_code=404, detail="Provenance graph not found for this run")
    return graph_data
