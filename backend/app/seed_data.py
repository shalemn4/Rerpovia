import hashlib
import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.auth import User, Organization, Project, Membership, RoleEnum
from app.models.workflow import Workflow, WorkflowVersion, WorkflowStep
from app.models.run import Run, RunStep, ExecutionLog, RunStatusEnum
from app.models.dataset import Dataset, DatasetVersion
from app.models.artifact import Artifact
from app.models.provenance import ProvenanceRecord
from app.storage.artifact_store import artifact_store

PARTICLE_ANALYSIS_YAML = """version: "1.0"
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
      LOG_LEVEL: "INFO"

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

MONTE_CARLO_YAML = """version: "1.0"
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

GENOMICS_YAML = """version: "1.0"
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

async def seed_initial_database():
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        res = await session.execute(select(User))
        if res.scalars().first():
            return

        # 1. User & Org
        user = User(
            id="usr-cern-001",
            email="h.vance@cern.ch",
            name="Dr. Helena Vance",
            role=RoleEnum.OWNER,
            institution="CERN EP-SFT / Reprovia"
        )
        session.add(user)

        org = Organization(
            id="org-cern-lhc",
            name="CERN Large Hadron Collider",
            slug="cern-lhc"
        )
        session.add(org)

        proj = Project(
            id="proj-particle-physics",
            org_id=org.id,
            name="Particle Resonance Investigation",
            slug="particle-resonance",
            description="High-precision invariant mass reconstruction on ATLAS collision open data."
        )
        session.add(proj)

        membership = Membership(
            id="mem-001",
            user_id=user.id,
            org_id=org.id,
            role=RoleEnum.OWNER
        )
        session.add(membership)

        # 2. Datasets
        dataset = Dataset(
            id="ds-cern-atlas-2026",
            project_id=proj.id,
            name="ATLAS Open Collision Stream 2026",
            slug="atlas-collisions-2026",
            description="Calibrated raw 13.6 TeV proton-proton collision events from ATLAS detector Run-3.",
            owner="Dr. H. Vance (CERN)",
            tags=json.dumps(["cern", "atlas", "run3", "lhc", "higgs"])
        )
        session.add(dataset)

        ds_version = DatasetVersion(
            id="dsv-001",
            dataset_id=dataset.id,
            version_tag="v1.2",
            checksum="a84f3c9e112d8a435b8813bcfe7842c129e06db10647c8a66d0309995be91d33",
            size_bytes=1482000000,
            storage_path="/data/raw/collisions_2026.bin",
            file_format="binary/root",
            lineage_metadata=json.dumps({"source": "CERN Open Data Portal", "license": "CC0-1.0"})
        )
        session.add(ds_version)

        # 3. Workflows
        wf1 = Workflow(
            id="wf-particle-analysis",
            project_id=proj.id,
            name="Particle Collision Analysis",
            slug="particle-collision-analysis",
            description="Multi-stage invariant mass reconstruction pipeline with statistical confidence estimation.",
            tags=json.dumps(["physics", "cern", "production", "dag"])
        )
        session.add(wf1)

        wf1_checksum = hashlib.sha256(PARTICLE_ANALYSIS_YAML.encode()).hexdigest()
        wf1_v1 = WorkflowVersion(
            id="wfv-particle-01",
            workflow_id=wf1.id,
            version_number=1,
            raw_yaml=PARTICLE_ANALYSIS_YAML,
            checksum=wf1_checksum
        )
        session.add(wf1_v1)

        # Additional template workflows
        wf2 = Workflow(
            id="wf-monte-carlo",
            project_id=proj.id,
            name="Monte Carlo Quantum Simulation",
            slug="monte-carlo-simulation",
            description="Lattice quantum field simulation measuring correlation functions.",
            tags=json.dumps(["quantum", "monte-carlo", "simulation"])
        )
        session.add(wf2)
        session.add(WorkflowVersion(
            id="wfv-mc-01",
            workflow_id=wf2.id,
            version_number=1,
            raw_yaml=MONTE_CARLO_YAML,
            checksum=hashlib.sha256(MONTE_CARLO_YAML.encode()).hexdigest()
        ))

        wf3 = Workflow(
            id="wf-genomics",
            project_id=proj.id,
            name="Genomic Variant Pathogenicity",
            slug="genomic-variant-classifier",
            description="Deep convolutional scoring of non-coding regulatory variants.",
            tags=json.dumps(["genomics", "deep-learning", "bioinformatics"])
        )
        session.add(wf3)
        session.add(WorkflowVersion(
            id="wfv-gen-01",
            workflow_id=wf3.id,
            version_number=1,
            raw_yaml=GENOMICS_YAML,
            checksum=hashlib.sha256(GENOMICS_YAML.encode()).hexdigest()
        ))

        # 4. Baseline Completed Run #184
        run_184_id = "run-184-cern-baseline"
        now = datetime.utcnow()
        start_time = now - timedelta(minutes=42)
        end_time = start_time + timedelta(seconds=18.4)

        run_184 = Run(
            id=run_184_id,
            project_id=proj.id,
            workflow_version_id=wf1_v1.id,
            run_number=184,
            status=RunStatusEnum.COMPLETED,
            triggered_by="Dr. H. Vance (CERN)",
            git_commit="c8a91f3",
            kubernetes_namespace="reprovia-workloads",
            parameters=json.dumps({"snr_threshold": 4.5, "mc_iterations": 10000, "random_seed": 42}),
            environment_vars=json.dumps({"OMP_NUM_THREADS": "4", "REPROVIA_STRICT_MODE": "1"}),
            started_at=start_time,
            completed_at=end_time,
            duration_seconds=18.4
        )
        session.add(run_184)

        # RunSteps for Run 184
        steps_info = [
            ("preprocess", "reprovia/preprocess:1.2", 0, "480m", "512Mi", 4.2),
            ("analyze", "reprovia/analyze:1.2", 0, "1200m", "1024Mi", 9.8),
            ("visualize", "reprovia/visualize:1.2", 0, "320m", "380Mi", 4.4)
        ]
        curr_step_time = start_time
        for s_name, s_img, code, cpu, mem, dur in steps_info:
            step_end = curr_step_time + timedelta(seconds=dur)
            step_db = RunStep(
                id=str(uuid.uuid4()),
                run_id=run_184_id,
                step_name=s_name,
                image=s_img,
                image_digest=f"sha256:{hashlib.sha256(s_img.encode()).hexdigest()}",
                status=RunStatusEnum.COMPLETED,
                pod_name=f"pod-{s_name}-88b14a",
                kubernetes_job_name=f"reprovia-{s_name}-run184",
                exit_code=code,
                cpu_usage=cpu,
                memory_usage=mem,
                started_at=curr_step_time,
                completed_at=step_end,
                duration_seconds=dur
            )
            session.add(step_db)
            curr_step_time = step_end

        # Execution Logs for Run 184
        sample_logs = [
            ("preprocess", "stdout", "k8s-node-worker: Pod initialized in namespace reprovia-workloads"),
            ("preprocess", "stdout", "Loading raw particle detector event streams from /data/raw/collisions_2026.bin"),
            ("preprocess", "stdout", "Parsing 1,250,000 calorimeter hits across 4 detector quadrants..."),
            ("preprocess", "stdout", "Filtering detector baseline noise (SNR > 4.5 dB): 98.4% events retained"),
            ("preprocess", "stdout", "Normalizing momentum vectors [px, py, pz, E] into standard GeV/c coordinates"),
            ("preprocess", "stdout", "Preprocess verification: sha256 checksum calculated successfully."),
            ("analyze", "stdout", "Initializing scientific analysis kernels with 8 parallel worker threads..."),
            ("analyze", "stdout", "Computing invariant mass distribution for di-muon candidate pairs..."),
            ("analyze", "stdout", "Fitting relativistic Breit-Wigner resonance curve to invariant mass peaks..."),
            ("analyze", "stdout", "Running Monte Carlo confidence interval estimation (10,000 iterations)..."),
            ("analyze", "stdout", "Observed Higgs candidate resonance at 125.09 ± 0.24 GeV with 5.2-sigma significance"),
            ("visualize", "stdout", "Reading resonance parameters from /results/analysis.csv..."),
            ("visualize", "stdout", "Rendering publication-ready invariant mass histogram (matplotlib/seaborn backend)..."),
            ("visualize", "stdout", "Generating 3D spatial collision track diagram (CERN-standard geometry)..."),
            ("visualize", "stdout", "Artifact generation completed: 3 files registered in artifact store.")
        ]
        for s_name, stream, msg in sample_logs:
            session.add(ExecutionLog(
                id=str(uuid.uuid4()),
                run_id=run_184_id,
                step_name=s_name,
                stream=stream,
                timestamp=start_time + timedelta(seconds=2),
                message=msg
            ))

        # Create physical artifacts in storage
        summary_data = {
            "run_id": run_184_id,
            "experiment": "particle-collision-analysis",
            "convergence_sigma": 5.24,
            "resonance_peak_gev": 125.09,
            "events_processed": 1250000,
            "detector_snr_db": 4.82,
            "computational_nodes": 4,
            "reproducibility_fingerprint": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
        }
        res_summary = await artifact_store.put_artifact(
            run_id=run_184_id,
            artifact_name="summary.json",
            content=json.dumps(summary_data, indent=2)
        )

        csv_rows = [
            "bin_index,energy_bin_gev,signal_counts,background_counts,statistical_uncertainty",
            "01,110.0-112.5,420,412,20.5",
            "02,112.5-115.0,490,465,22.1",
            "03,115.0-117.5,610,540,24.7",
            "04,117.5-120.0,850,680,29.1",
            "05,120.0-122.5,1340,890,36.6",
            "06,122.5-125.0,2450,1105,49.5",
            "07,125.0-127.5,2890,1130,53.8",
            "08,127.5-130.0,1920,950,43.8",
            "09,130.0-132.5,1180,820,34.3",
            "10,132.5-135.0,760,650,27.5"
        ]
        res_csv = await artifact_store.put_artifact(
            run_id=run_184_id,
            artifact_name="analysis.csv",
            content="\n".join(csv_rows)
        )

        svg_art = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%" style="background:#0c192c; font-family:'JetBrains Mono',monospace;">
  <rect width="800" height="500" fill="#08111e"/>
  <g stroke="#1e293b" stroke-width="1">
    <line x1="80" y1="50" x2="80" y2="420" stroke="#64748b"/>
    <line x1="80" y1="420" x2="740" y2="420" stroke="#64748b"/>
    <line x1="80" y1="350" x2="740" y2="350" stroke-dasharray="4 4"/>
    <line x1="80" y1="280" x2="740" y2="280" stroke-dasharray="4 4"/>
    <line x1="80" y1="210" x2="740" y2="210" stroke-dasharray="4 4"/>
    <line x1="80" y1="140" x2="740" y2="140" stroke-dasharray="4 4"/>
  </g>
  <text x="80" y="35" fill="#f8fafc" font-size="14" font-weight="bold">REPROVIA SCIENTIFIC OBSERVATION: Invariant Mass Diphoton Peak</text>
  <text x="560" y="35" fill="#38bdf8" font-size="11">Run #184 | 5.2σ Significance</text>
  <path d="M 100,380 Q 250,330 400,290 T 700,240" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="3 3"/>
  <path d="M 100,380 Q 300,340 370,220 Q 400,90 430,220 Q 500,310 700,240" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="400" cy="90" r="6" fill="#1d63ed" stroke="#ffffff" stroke-width="2"/>
  <text x="415" y="95" fill="#ffffff" font-size="12" font-weight="bold">m_H = 125.09 GeV</text>
  <text x="350" y="460" fill="#94a3b8" font-size="12">Di-muon Invariant Mass m_μμ [GeV/c²]</text>
  <text x="25" y="240" fill="#94a3b8" font-size="12" transform="rotate(-90 25 240)">Events / 2.5 GeV</text>
</svg>"""
        res_svg = await artifact_store.put_artifact(
            run_id=run_184_id,
            artifact_name="histogram.svg",
            content=svg_art
        )

        session.add(Artifact(
            id=str(uuid.uuid4()),
            run_id=run_184_id,
            step_name="visualize",
            name="summary.json",
            file_type="json",
            size_bytes=res_summary["size_bytes"],
            checksum=res_summary["checksum"],
            storage_path=res_summary["path"]
        ))
        session.add(Artifact(
            id=str(uuid.uuid4()),
            run_id=run_184_id,
            step_name="analyze",
            name="analysis.csv",
            file_type="csv",
            size_bytes=res_csv["size_bytes"],
            checksum=res_csv["checksum"],
            storage_path=res_csv["path"]
        ))
        session.add(Artifact(
            id=str(uuid.uuid4()),
            run_id=run_184_id,
            step_name="visualize",
            name="histogram.svg",
            file_type="svg",
            size_bytes=res_svg["size_bytes"],
            checksum=res_svg["checksum"],
            storage_path=res_svg["path"]
        ))

        # Immutable Provenance Record for Run 184
        prov_record = ProvenanceRecord(
            id=str(uuid.uuid4()),
            run_id=run_184_id,
            workflow_id=wf1.id,
            workflow_version=1,
            workflow_checksum=wf1_checksum,
            git_commit="c8a91f3",
            dataset_id=dataset.id,
            dataset_version="v1.2",
            dataset_checksum=ds_version.checksum,
            container_images_json=json.dumps([
                {"step_name": "preprocess", "image": "reprovia/preprocess:1.2", "digest": "sha256:d8a941f124b1"},
                {"step_name": "analyze", "image": "reprovia/analyze:1.2", "digest": "sha256:4b9a8c7e2213"},
                {"step_name": "visualize", "image": "reprovia/visualize:1.2", "digest": "sha256:1a84f3c955e8"}
            ]),
            parameters_json=run_184.parameters,
            environment_vars_json=run_184.environment_vars,
            kubernetes_spec_json=json.dumps({
                "api_version": "batch/v1",
                "kind": "Job",
                "namespace": "reprovia-workloads"
            }),
            output_checksums_json=json.dumps({
                "summary.json": res_summary["checksum"],
                "analysis.csv": res_csv["checksum"],
                "histogram.svg": res_svg["checksum"]
            }),
            is_immutable=True,
            created_at=start_time
        )
        session.add(prov_record)

        await session.commit()
