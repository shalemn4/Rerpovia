import React from 'react';
import { ArrowRight, Play, Server, GitBranch, ShieldCheck, Box } from 'lucide-react';

interface SpatialHeroProps {
  onNavigate: (tab: string, runId?: string) => void;
}

export const SpatialHero: React.FC<SpatialHeroProps> = ({ onNavigate }) => {
  return (
    <section
      className="bg-technical-grid"
      style={{
        padding: '48px 40px 60px 40px',
        borderBottom: 'var(--border-hairline)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* CERN Blueprint Annotations */}
      <div style={{ position: 'absolute', top: '24px', right: '48px', textAlign: 'right' }}>
        <span className="blueprint-annotation" style={{ fontSize: '1.2rem' }}>
          CERN GENEVA ↓
        </span>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--navy-muted)', marginTop: '2px' }}>
          FACILITY: 46.2330° N, 6.0557° E • LHC RUN-3
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '24px', right: '48px' }}>
        <span className="font-annotation" style={{ fontSize: '1.1rem' }}>
          "Open science for a reproducible tomorrow"
        </span>
      </div>

      {/* Main Editorial Header */}
      <div style={{ maxWidth: '780px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--electric-blue)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            COMPUTE • TRACE • REPRODUCE
          </span>
          <div style={{ width: '40px', height: '1px', background: 'var(--electric-blue)' }} />
          <span className="badge-arch badge-matched" style={{ fontSize: '10px' }}>
            KUBERNETES JOBS ENGINE
          </span>
        </div>

        <h1 className="h1-editorial" style={{ marginBottom: '18px' }}>
          Reproduce <br />
          the future.
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--navy-600)', lineHeight: '1.6', maxWidth: '620px', marginBottom: '28px' }}>
          A production-grade scientific infrastructure for computational research. Create DAG workflows, execute them in isolated Kubernetes containers, record immutable cryptographic provenance, and scientifically verify reproductions.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn-reprovia-primary"
            onClick={() => onNavigate('builder')}
          >
            <span>Launch Workflow Builder</span>
            <ArrowRight size={14} />
          </button>

          <button
            className="btn-reprovia-secondary"
            onClick={() => onNavigate('runs')}
          >
            <Play size={14} />
            <span>Inspect Baseline Run #184</span>
          </button>

          <button
            className="btn-reprovia-secondary"
            onClick={() => onNavigate('infrastructure')}
          >
            <Server size={14} />
            <span>Cluster Topology</span>
          </button>
        </div>
      </div>

      {/* 3D Spatial Architectural Stages (Perspective Plane) */}
      <div
        className="spatial-stage"
        style={{
          marginTop: '44px',
          padding: '10px 0'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            position: 'relative'
          }}
        >
          {/* Step 1: BUILD */}
          <div
            className="spatial-card-3d"
            style={{ cursor: 'pointer', borderTop: '3px solid var(--navy-800)' }}
            onClick={() => onNavigate('builder')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)', fontWeight: 600 }}>
                01 / SPECIFY
              </span>
              <GitBranch size={16} color="var(--navy-800)" />
            </div>
            <h3 className="h3-editorial" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              Build
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: 1.4 }}>
              Define multi-step DAG workflows via synchronized Monaco YAML and interactive React Flow nodes.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', fontWeight: 600 }}>
              <span>OPEN EDITOR</span>
              <ArrowRight size={12} />
            </div>
          </div>

          {/* Step 2: EXECUTE */}
          <div
            className="spatial-card-3d"
            style={{ cursor: 'pointer', borderTop: '3px solid var(--electric-blue)' }}
            onClick={() => onNavigate('runs')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600 }}>
                02 / ISOLATE
              </span>
              <Box size={16} color="var(--electric-blue)" />
            </div>
            <h3 className="h3-editorial" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              Execute
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: 1.4 }}>
              Containerized Kubernetes Jobs with namespace isolation, resource bounds, and real-time SSE streaming.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', fontWeight: 600 }}>
              <span>VIEW RUNS</span>
              <ArrowRight size={12} />
            </div>
          </div>

          {/* Step 3: TRACE */}
          <div
            className="spatial-card-3d"
            style={{ cursor: 'pointer', borderTop: '3px solid #6366f1' }}
            onClick={() => onNavigate('runs')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                03 / PROVENANCE
              </span>
              <ShieldCheck size={16} color="#6366f1" />
            </div>
            <h3 className="h3-editorial" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              Trace
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: 1.4 }}>
              Immutable cryptographic records locking dataset hashes, git commits, OCI digests, and parameters.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', fontWeight: 600 }}>
              <span>INSPECT GRAPH</span>
              <ArrowRight size={12} />
            </div>
          </div>

          {/* Step 4: REPRODUCE */}
          <div
            className="spatial-card-3d"
            style={{ cursor: 'pointer', borderTop: '3px solid var(--status-matched)' }}
            onClick={() => onNavigate('runs')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--status-matched)', fontWeight: 600 }}>
                04 / VERIFY
              </span>
              <Play size={16} color="var(--status-matched)" />
            </div>
            <h3 className="h3-editorial" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              Reproduce
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: 1.4 }}>
              One-click re-execution with multi-vector matrix comparison: MATCHED / DIFFERENT / INCONCLUSIVE.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', fontWeight: 600 }}>
              <span>REPRODUCE RUN</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
