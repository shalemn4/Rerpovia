import hashlib
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.workflow import Workflow, WorkflowVersion, WorkflowStep
from app.workflows.validator import validate_and_normalize_workflow
from app.schemas.workflow_yaml import ValidationResult

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

class ValidateRequest(BaseModel):
    yaml_content: str

class CreateWorkflowRequest(BaseModel):
    project_id: str
    name: str
    description: str = ""
    tags: list[str] = []
    yaml_content: str

class PublishVersionRequest(BaseModel):
    yaml_content: str

@router.post("/validate", response_model=ValidationResult)
async def validate_yaml(req: ValidateRequest):
    """
    Validates workflow YAML against schema and verifies acyclicity (DAG).
    Returns syntax/schema/dependency errors or normalized DAG for React Flow.
    """
    return validate_and_normalize_workflow(req.yaml_content)

@router.get("")
async def list_workflows(project_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Lists all workflows for a project."""
    stmt = select(Workflow)
    if project_id:
        stmt = stmt.where(Workflow.project_id == project_id)
    workflows = (await db.execute(stmt)).scalars().all()

    results = []
    for wf in workflows:
        # Get latest version
        v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == wf.id).order_by(WorkflowVersion.version_number.desc()).limit(1)
        latest_ver = (await db.execute(v_stmt)).scalars().first()
        results.append({
            "id": wf.id,
            "name": wf.name,
            "slug": wf.slug,
            "description": wf.description,
            "tags": json.loads(wf.tags) if wf.tags else [],
            "version": latest_ver.version_number if latest_ver else 1,
            "created_at": wf.created_at.isoformat(),
            "updated_at": wf.updated_at.isoformat()
        })
    return results

TEMPLATES = [
    {
        "id": "tpl-particle-analysis",
        "title": "Particle Collision Analysis",
        "category": "High Energy Physics",
        "description": "Calibrated ATLAS LHC invariant mass reconstruction with Monte Carlo Breit-Wigner resonance fitting.",
        "steps": ["preprocess", "analyze", "visualize"],
        "tags": ["CERN", "Physics", "ROOT", "Higgs"],
        "yaml_content": """version: "1.0"
name: particle-analysis
description: "Higgs boson invariant mass reconstruction from ATLAS open collision data."

inputs:
  dataset: /data/raw/collisions_2026.bin
  detector_calibration: /data/calib/geom_v4.json

steps:
  - name: preprocess
    image: reprovia/preprocess:1.2
    command: python preprocess.py --input /data/raw/collisions_2026.bin --snr 4.5 --out /data/preprocessed/events.parquet
    resources:
      cpu_request: "500m"
      memory_request: "512Mi"
      cpu_limit: "1000m"
      memory_limit: "1Gi"
    env:
      OMP_NUM_THREADS: "4"

  - name: analyze
    image: reprovia/analyze:1.2
    command: python analyze.py --events /data/preprocessed/events.parquet --bins 100 --out /results/analysis.csv
    depends_on:
      - preprocess
    resources:
      cpu_request: "1000m"
      memory_request: "1Gi"
      cpu_limit: "2000m"
      memory_limit: "2Gi"
    env:
      MC_ITERATIONS: "10000"
      RANDOM_SEED: "42"

  - name: visualize
    image: reprovia/visualize:1.2
    command: python visualize.py --fit /results/analysis.csv --out /results/histogram.svg
    depends_on:
      - analyze
    resources:
      cpu_request: "500m"
      memory_request: "512Mi"
      cpu_limit: "1000m"
      memory_limit: "1Gi"
    outputs:
      - /results/histogram.svg
      - /results/summary.json
      - /results/analysis.csv

outputs:
  - /results/summary.json
  - /results/analysis.csv
  - /results/histogram.svg
"""
    },
    {
        "id": "tpl-monte-carlo",
        "title": "Monte Carlo Quantum Simulation",
        "category": "Quantum Computing & Field Theory",
        "description": "Lattice quantum field simulation measuring 4D correlation functions with GPU acceleration.",
        "steps": ["lattice_init", "thermalize", "sample_observables"],
        "tags": ["Quantum", "Simulation", "Lattice", "GPU"],
        "yaml_content": """version: "1.0"
name: monte-carlo-simulation
description: "Parallel Monte Carlo quantum fluctuation simulation with GPU acceleration."

inputs:
  lattice_config: /data/lattice/grid_64x64.json

steps:
  - name: lattice_init
    image: reprovia/lattice:2.0
    command: python init_lattice.py --dim 64 --coupling 0.23

  - name: thermalize
    image: reprovia/montecarlo:2.0
    command: python thermalize.py --sweeps 50000 --seed 1337
    depends_on:
      - lattice_init

  - name: sample_observables
    image: reprovia/montecarlo:2.0
    command: python sample.py --measurements 100000 --out /results/correlators.csv
    depends_on:
      - thermalize

outputs:
  - /results/correlators.csv
"""
    },
    {
        "id": "tpl-genomics",
        "title": "Deep Learning Genomic Variant Classifier",
        "category": "Computational Biology",
        "description": "Functional scoring of non-coding regulatory genomic variants using deep residual neural networks.",
        "steps": ["vcf_qc", "deep_score"],
        "tags": ["Bioinformatics", "Genomics", "Deep Learning"],
        "yaml_content": """version: "1.0"
name: genomic-variant-classifier
description: "Non-coding functional variant pathogenicity scoring via deep residual convolutions."

inputs:
  vcf_input: /data/variants/chr22_sample.vcf.gz

steps:
  - name: vcf_qc
    image: reprovia/bio-qc:1.0
    command: bcftools stats /data/variants/chr22_sample.vcf.gz > /data/qc_metrics.txt

  - name: deep_score
    image: reprovia/alphagenome-score:1.4
    command: python score_variants.py --vcf /data/variants/chr22_sample.vcf.gz --model resnet50 --out /results/scores.tsv
    depends_on:
      - vcf_qc

outputs:
  - /results/scores.tsv
"""
    },
    {
        "id": "tpl-astro",
        "title": "Astronomical Image Deconvolution",
        "category": "Astrophysics",
        "description": "Multi-wavelength interferometry optical transfer function restoration for telescope arrays.",
        "steps": ["load_fits", "richardson_lucy", "export_skymap"],
        "tags": ["Astronomy", "Images", "FFT"],
        "yaml_content": """version: "1.0"
name: astronomical-image-deconvolution
description: "Multi-wavelength interferometry optical transfer function restoration for telescope arrays."

inputs:
  fits_raw: /data/telescope/skymap_raw.fits

steps:
  - name: load_fits
    image: reprovia/astropy:5.3
    command: python parse_fits.py --input /data/telescope/skymap_raw.fits --out /data/arrays/channels.npy

  - name: richardson_lucy
    image: reprovia/deconv:2.1
    command: python richardson_lucy.py --arrays /data/arrays/channels.npy --iterations 50 --out /results/restored_map.fits
    depends_on:
      - load_fits

  - name: export_skymap
    image: reprovia/astropy:5.3
    command: python render_skymap.py --fits /results/restored_map.fits --out /results/skymap_hd.png
    depends_on:
      - richardson_lucy

outputs:
  - /results/restored_map.fits
  - /results/skymap_hd.png
"""
    }
]

@router.get("/templates")
async def list_templates():
    """Lists preconfigured reproducible workflow archetypes."""
    return TEMPLATES
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full workflow details, latest version YAML, and normalized DAG."""
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == wf.id).order_by(WorkflowVersion.version_number.desc()).limit(1)
    latest_ver = (await db.execute(v_stmt)).scalars().first()

    raw_yaml = latest_ver.raw_yaml if latest_ver else ""
    val_res = validate_and_normalize_workflow(raw_yaml) if raw_yaml else None

    return {
        "id": wf.id,
        "project_id": wf.project_id,
        "name": wf.name,
        "slug": wf.slug,
        "description": wf.description,
        "tags": json.loads(wf.tags) if wf.tags else [],
        "version": latest_ver.version_number if latest_ver else 1,
        "raw_yaml": raw_yaml,
        "checksum": latest_ver.checksum if latest_ver else "",
        "normalized_dag": val_res.normalized_dag if val_res else None,
        "is_valid": val_res.is_valid if val_res else True,
        "created_at": wf.created_at.isoformat(),
        "updated_at": wf.updated_at.isoformat()
    }

@router.post("")
async def create_workflow(req: CreateWorkflowRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new workflow and publishes its initial version."""
    # First validate YAML
    val_res = validate_and_normalize_workflow(req.yaml_content)
    if not val_res.is_valid:
        raise HTTPException(status_code=400, detail={"errors": [e.model_dump() for e in val_res.errors]})

    wf_id = str(uuid.uuid4())
    slug = req.name.lower().replace(" ", "-")

    wf = Workflow(
        id=wf_id,
        project_id=req.project_id,
        name=req.name,
        slug=slug,
        description=req.description,
        tags=json.dumps(req.tags)
    )
    db.add(wf)

    checksum = hashlib.sha256(req.yaml_content.encode()).hexdigest()
    wf_ver = WorkflowVersion(
        id=str(uuid.uuid4()),
        workflow_id=wf_id,
        version_number=1,
        raw_yaml=req.yaml_content,
        checksum=checksum
    )
    db.add(wf_ver)
    await db.commit()

    return {"id": wf_id, "name": req.name, "version": 1, "checksum": checksum}

@router.post("/{workflow_id}/versions")
async def publish_new_version(workflow_id: str, req: PublishVersionRequest, db: AsyncSession = Depends(get_db)):
    """Publishes an immutable new version of a workflow."""
    wf = await db.get(Workflow, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    val_res = validate_and_normalize_workflow(req.yaml_content)
    if not val_res.is_valid:
        raise HTTPException(status_code=400, detail={"errors": [e.model_dump() for e in val_res.errors]})

    # Get max version
    v_stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == workflow_id).order_by(WorkflowVersion.version_number.desc()).limit(1)
    prev_ver = (await db.execute(v_stmt)).scalars().first()
    new_ver_num = (prev_ver.version_number + 1) if prev_ver else 1

    checksum = hashlib.sha256(req.yaml_content.encode()).hexdigest()
    new_ver = WorkflowVersion(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        version_number=new_ver_num,
        raw_yaml=req.yaml_content,
        checksum=checksum
    )
    db.add(new_ver)
    await db.commit()

    return {
        "workflow_id": workflow_id,
        "version": new_ver_num,
        "checksum": checksum,
        "normalized_dag": val_res.normalized_dag
    }
