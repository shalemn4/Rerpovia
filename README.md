# REPROVIA - Reproducible Science Infrastructure

<div align="center">

```
             REPROVIA
                │
         Research Space
                │
   ┌────────────┼────────────┐
   ↓            ↓            ↓
 BUILD       EXECUTE       TRACE
   │            │            │
Workflow   Kubernetes   Provenance
 Graph        Jobs        Graph
   │            │            │
   └────────────┼────────────┘
                ↓
            REPRODUCE
                ↓
              SHARE
```

**Production-grade infrastructure platform for reproducible computational research, workflow DAG orchestration, containerized execution, live observability, immutable provenance, and scientific reproduction.**

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Batch%2Fv1%20Jobs-326CE5.svg)](https://kubernetes.io/)
[![Helm](https://img.shields.io/badge/Helm-3-0F1689.svg)](https://helm.sh/)

</div>

---

## 🔬 Core Product Concept

$$\text{User} \longrightarrow \text{React UI} \longrightarrow \text{Python/FastAPI} \longrightarrow \text{Kubernetes} \longrightarrow \text{Docker Jobs} \longrightarrow \text{Results \& Provenance}$$

REPROVIA enables researchers to:
- **Build**: Define reproducible Directed Acyclic Graph (DAG) computational workflows using a synchronized Monaco YAML Editor and interactive React Flow visual builder.
- **Execute**: Run workflow steps as isolated Docker containers within Kubernetes namespaces (`Batch/v1 Jobs`) with resource requests/limits, volume mounts, and ConfigMaps/Secrets.
- **Observe**: Stream live container stdout/stderr telemetry in real-time using Server-Sent Events (SSE).
- **Trace**: Generate immutable cryptographic provenance graphs locking exact dataset checksums, git commits, OCI digests, and runtime parameters.
- **Reproduce**: Execute one-click reproductions and evaluate scientific results using a multi-vector comparison matrix (`MATCHED`, `DIFFERENT`, `INCONCLUSIVE`).

---

## 🏛️ Architecture & System Topology

```text
                                 REPROVIA
                                    │
                         React 18 + TypeScript
                                    │
               ┌────────────────────┼────────────────────┐
               ↓                    ↓                    ↓
          PostgreSQL         Workflow Engine       Artifact Store
               │                    │                    │
               │             Execution Queue             │
               │                    ↓                    │
               │           Kubernetes Adapter            │
               │                    ↓                    │
               │             Kubernetes Jobs             │
               │                    ↓                    │
               └─────────────── Provenance ──────────────┘
```

### Core Components

1. **Frontend (`frontend/`)**:
   - **Dual-Personality UI**:
     - *Spatial Mode*: Architectural 3D perspective, computational layer transitions, and handwritten blueprint notes inspired by CERN.
     - *Work Mode*: High-density operational interface with zero animation overhead.
   - **Horizontal Workspace Menu**: Expandable modular drawer grouping all 10 application areas.
   - **Synchronized Builder**: Monaco Editor on the left and React Flow on the right, driven by YAML as the single source of truth.

2. **Backend (`backend/`)**:
   - **FastAPI Application**: High-performance asynchronous REST API with typed Pydantic schemas and structured request logging.
   - **Database Layer**: PostgreSQL / SQLite via SQLAlchemy 2.0 async engine.
   - **DAG Validator**: Topological sorting and cycle detection using Kahn's algorithm.
   - **Execution Adapter Pattern (`backend/app/execution/`)**:
     - `interface.py`: Abstract `Executor` interface (`submit`, `get_status`, `get_logs`, `cancel`).
     - `mock_executor.py`: Realistic local container simulation emitting scientific domain logs and metrics.
     - `kubernetes_executor.py`: Official Kubernetes `BatchV1Api` & `CoreV1Api` deployment into isolated namespaces.
     - Switch dynamically via `EXECUTION_MODE=mock` or `EXECUTION_MODE=kubernetes`.

3. **Artifact Storage Layer (`backend/app/storage/`)**:
   - Local filesystem and S3/MinIO compatible object storage abstraction for datasets, step inputs/outputs, and reports.

4. **Scientific Reproduction Engine (`backend/app/provenance/`)**:
   - Cryptographic comparison across 7 vectors:
     - `INPUTS`: Binary dataset bitwise equality check
     - `WORKFLOW`: YAML definition and resource bounds checksum
     - `CONTAINER`: OCI image digests
     - `PARAMETERS`: Runtime hyperparameters
     - `ENVIRONMENT`: Environment variables and flags
     - `OUTPUT CHECKSUM`: SHA-256 digests of all generated files
     - `NUMERICAL OUTPUT`: Numerical stability & convergence epsilon
   - Verdict classifications: **`MATCHED`**, **`DIFFERENT`**, or **`INCONCLUSIVE`**.

5. **Infrastructure & Deployment (`helm/`, `docker/`, `.github/`)**:
   - Production-oriented Helm chart (`helm/reprovia`) with PostgreSQL statefulset, ingress/TLS, and resource policies.
   - Multi-stage Dockerfiles for backend and frontend.
   - GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`).

---

## ⚡ Quickstart Guide

### 1. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/macOS)

# Install dependencies
pip install -r requirements.txt

# Run unit tests (DAG validation, cycle detection, comparator)
pytest

# Launch FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- API Server: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

- Web Interface: `http://127.0.0.1:5173/`

---

## 📋 Reproducible Workflow Specification

Workflows are authored in a clean, reproducible YAML specification:

```yaml
version: "1.0"
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
    outputs:
      - /results/histogram.svg
      - /results/summary.json
      - /results/analysis.csv

outputs:
  - /results/summary.json
  - /results/analysis.csv
  - /results/histogram.svg
```

---

## ☸️ Kubernetes Deployment (Helm)

To deploy REPROVIA onto a Kubernetes cluster:

```bash
# Lint the chart
helm lint ./helm/reprovia

# Dry-run template generation
helm template reprovia ./helm/reprovia

# Deploy to namespace
helm upgrade --install reprovia ./helm/reprovia \
  --namespace reprovia-system \
  --create-namespace \
  --set api.executionMode=kubernetes
```

---

## 👥 Roles & Access Control (RBAC)

| Role | Permissions |
| :--- | :--- |
| **OWNER** | Full administrative control, cluster execution, secrets, and member management. |
| **RESEARCHER** | Can create, execute, reproduce workflows and publish datasets. |
| **DEVELOPER** | Can build workflows and configure container environments. |
| **VIEWER** | Read-only access to published workflows, results, and provenance records. |

---

## 📄 License & Attribution

Built for open science, high energy physics, and computational research teams.  
Developed under the **MIT License**.
