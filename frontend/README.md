# REPROVIA — Frontend Application

Production-grade web interface for **REPROVIA** (Reproducible Science Infrastructure), built for computational research, workflow orchestration, live container observability, and immutable provenance tracking.

---

## 🏛️ Design Philosophy & Aesthetics

Inspired by the editorial aesthetics of scientific research institutions like CERN:
- **Palette**: Warm off-white / cream surfaces (`#f7f5f0`, `#fdfbf7`), deep technical navy (`#0c192c`, `#08111e`), and restrained electric blue accents (`#1d63ed`).
- **Typography**: Editorial sans-serif (`Space Grotesk`), clean body text (`Inter`), monospaced telemetry (`JetBrains Mono`), and subtle handwritten blueprint notes (`Caveat`).
- **Texture**: Thin technical grid lines (`28px` grid pattern) and crisp architectural bevels.
- **Dual-Personality UI**:
  - **Spatial Mode**: 3D spatial perspective, architectural stages (Build → Execute → Trace → Reproduce), and blueprint annotations.
  - **Work Mode**: Ultra-dense, high-contrast, zero-lag operational interface with full-width tables, terminal viewers, and raw code views.

---

## 🛠️ Technology Stack

- **Core**: React 18 + TypeScript + Vite
- **Styling**: 100% Vanilla CSS (`src/index.css`) with CSS custom properties and 3D perspective transforms (no Tailwind)
- **Workflow DAG Visualizer**: React Flow (`@xyflow/react`) with custom scientific nodes (`ComputeStepNode`, `DatasetNode`, `ResultsNode`)
- **Workflow Code Editor**: Monaco Editor (`@monaco-editor/react`) with YAML syntax highlighting and line numbers
- **Real-Time Telemetry**: Server-Sent Events (SSE) consumer for live log streaming and container status updates
- **Icons**: Lucide React (`lucide-react`)

---

## 📂 Application Structure

```text
src/
├── api/                  # Typed API client for FastAPI backend
│   └── client.ts
├── components/           # Reusable UI & architectural elements
│   ├── customNodes/      # React Flow custom node components
│   │   ├── ComputeStepNode.tsx
│   │   ├── DatasetNode.tsx
│   │   └── ResultsNode.tsx
│   ├── Navigation.tsx    # Horizontal navigation bar & expandable workspace drawer
│   ├── ProvenanceGraphView.tsx
│   ├── ReproductionComparisonModal.tsx
│   ├── SpatialHero.tsx   # CERN blueprint hero & 3D perspective stage
│   └── TerminalLogViewer.tsx # Professional log terminal with SSE & filters
├── types/                # TypeScript interfaces (Runs, Workflows, Datasets, Provenance)
│   └── index.ts
├── views/                # Primary workspace views
│   ├── ArtifactsView.tsx # Artifact tree, CSV tables, SVG plots, JSON preview
│   ├── DashboardView.tsx # Operational research dashboard & cluster vitals
│   ├── DatasetsView.tsx  # Dataset registry, versions, lineage & checksums
│   ├── InfrastructureView.tsx # K8s worker nodes, CPU/RAM telemetry, Helm status
│   ├── MembersView.tsx   # Organization members, RBAC roles & permissions
│   ├── RunDetailView.tsx # Run lifecycle, live logs, resonance plots, reproduction
│   ├── RunsView.tsx      # Execution history, filters, and reproduction triggers
│   ├── SettingsView.tsx  # Execution mode toggle (Mock vs K8s), storage backends
│   ├── TemplatesView.tsx # Reusable physics archetypes (LHC, Monte Carlo, Genomics)
│   ├── WorkflowBuilderView.tsx # Synchronized Monaco YAML + React Flow builder
│   └── WorkflowsView.tsx # Published reproducible DAG specifications
├── App.tsx               # Master router and mode state controller
├── index.css             # Vanilla CSS design system tokens & utilities
└── main.tsx              # Application entrypoint
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended, tested on v22.14.0)
- npm (v10+)
- REPROVIA Backend running on `http://127.0.0.1:8000`

### Installation & Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will be accessible at: `http://127.0.0.1:5173/`

### Production Build

```bash
# Typecheck & build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🧭 Key Workspaces

1. **Horizontal Workspace Menu**: Click the `WORKSPACE MENU` button to expand the modular full-width container drawer grouping all 10 areas into *Computational Workflows*, *Scientific Data & Artifacts*, and *Infrastructure & Governance*.
2. **Synchronized Workflow Builder**: Left pane Monaco Editor parses and validates YAML with DAG cycle detection; right pane React Flow DAG updates in real-time.
3. **Dedicated Run Detail**: Monitor container status (`QUEUED` → `STARTING` → `RUNNING` → `COMPLETED`), stream logs over SSE, inspect the di-photon invariant mass resonance plot ($m_H = 125.09 \pm 0.24\text{ GeV}$), and trace the cryptographic provenance chain.
4. **One-Click Scientific Reproduction**: Click `Reproduce Run` on any completed run to rerun the exact pinned environment and view the scientific comparison report (`MATCHED` / `DIFFERENT` / `INCONCLUSIVE`).
