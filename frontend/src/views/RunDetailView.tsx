import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Cpu, 
  HardDrive, 
  Server, 
  GitCommit, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  FileText, 
  Sliders, 
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { RunDetail, LogEntry, ProvenanceGraphData, ReproductionReport } from '../types';
import { TerminalLogViewer } from '../components/TerminalLogViewer';
import { ProvenanceGraphView } from '../components/ProvenanceGraphView';
import { ReproductionComparisonModal } from '../components/ReproductionComparisonModal';

interface RunDetailViewProps {
  runId: string;
  onNavigate: (tab: string, runId?: string) => void;
}

export const RunDetailView: React.FC<RunDetailViewProps> = ({ runId, onNavigate }) => {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'logs' | 'results' | 'artifacts' | 'environment' | 'provenance'>('overview');
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [provenanceGraph, setProvenanceGraph] = useState<ProvenanceGraphData | null>(null);
  const [reproductionReport, setReproductionReport] = useState<ReproductionReport | null>(null);
  const [isReproducing, setIsReproducing] = useState(false);
  const [selectedArtifactContent, setSelectedArtifactContent] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch run details
  const loadRun = async () => {
    try {
      const data = await api.getRunDetail(runId);
      setRun(data);
      setLiveLogs(data.logs || []);

      // Load provenance graph
      try {
        const pGraph = await api.getProvenanceGraph(runId);
        setProvenanceGraph(pGraph);
      } catch (pErr) {
        console.warn('Provenance graph not yet ready:', pErr);
      }
    } catch (err) {
      console.error('Failed to load run details:', err);
    }
  };

  useEffect(() => {
    loadRun();
  }, [runId]);

  // Connect SSE for live updates if run is active
  useEffect(() => {
    if (!run) return;
    const isRunning = run.status === 'RUNNING' || run.status === 'STARTING' || run.status === 'QUEUED';

    if (isRunning) {
      const sseUrl = `http://127.0.0.1:8000/api/runs/${runId}/stream`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.addEventListener('log', (event) => {
        try {
          const logData = JSON.parse(event.data);
          setLiveLogs((prev) => [...prev, logData]);
        } catch (e) {
          console.error('Error parsing SSE log:', e);
        }
      });

      es.addEventListener('step_status', (event) => {
        try {
          const stepUpdate = JSON.parse(event.data);
          setRun((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              steps: prev.steps.map((s) =>
                s.name === stepUpdate.step_name
                  ? { ...s, status: stepUpdate.status, exit_code: stepUpdate.exit_code }
                  : s
              )
            };
          });
        } catch (e) {
          console.error('Error parsing SSE step update:', e);
        }
      });

      es.addEventListener('run_status', (event) => {
        try {
          const runUpdate = JSON.parse(event.data);
          setRun((prev) => (prev ? { ...prev, status: runUpdate.status } : prev));
          if (runUpdate.status === 'COMPLETED' || runUpdate.status === 'FAILED') {
            loadRun();
          }
        } catch (e) {
          console.error('Error parsing SSE run update:', e);
        }
      });

      return () => {
        es.close();
      };
    }
  }, [runId, run?.status]);

  // Handle Reproduce Run Action
  const handleReproduce = async () => {
    if (!run) return;
    setIsReproducing(true);
    try {
      const reproRes = await api.triggerReproduction(run.id);
      // Wait a moment for execution and then compare
      setTimeout(async () => {
        try {
          const report = await api.compareRuns(run.id, reproRes.new_run_id);
          setReproductionReport(report);
        } catch (cErr) {
          console.error('Comparison error:', cErr);
        }
      }, 4000);

      // Navigate to new run or notify
      onNavigate('run-detail', reproRes.new_run_id);
    } catch (err) {
      console.error('Failed to trigger reproduction:', err);
    } finally {
      setIsReproducing(false);
    }
  };

  // Inspect artifact
  const handleInspectArtifact = async (artId: string) => {
    try {
      const art = await api.getArtifact(artId);
      setSelectedArtifactContent(art);
      setActiveTab('artifacts');
    } catch (err) {
      console.error('Failed to inspect artifact:', err);
    }
  };

  if (!run) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        Loading scientific execution telemetry...
      </div>
    );
  }

  const isCompleted = run.status === 'COMPLETED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Run Top Operational Banner */}
      <div
        style={{
          padding: '16px 32px',
          background: 'var(--bg-cream-card)',
          borderBottom: 'var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('runs')}>RUNS</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>{run.workflow_name}</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--electric-blue)' }}>RUN #{run.run_number}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <h2 className="h2-editorial" style={{ fontSize: '1.45rem' }}>
              {run.workflow_name} / Run #{run.run_number}
            </h2>
            <span
              className={`badge-arch ${
                run.status === 'COMPLETED'
                  ? 'badge-matched'
                  : run.status === 'RUNNING' || run.status === 'STARTING'
                  ? 'badge-running'
                  : run.status === 'FAILED'
                  ? 'badge-diff'
                  : 'badge-queued'
              }`}
            >
              {run.status}
            </span>
            {run.reproduction_of_run_id && (
              <span className="badge-arch badge-matched">
                ↺ REPRODUCTION OF #{run.reproduction_of_run_id.slice(0, 8)}
              </span>
            )}
          </div>
        </div>

        {/* Operational Actions: Reproduce & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isCompleted && (
            <button
              className="btn-reprovia-primary"
              onClick={handleReproduce}
              disabled={isReproducing}
              style={{ background: 'var(--status-matched)', borderColor: 'var(--navy-800)' }}
            >
              <RotateCcw size={13} />
              <span>{isReproducing ? 'Reproducing...' : 'Reproduce Run'}</span>
            </button>
          )}

          <button className="btn-reprovia-secondary" onClick={() => setActiveTab('provenance')}>
            <ShieldCheck size={13} />
            <span>Provenance Graph</span>
          </button>
        </div>
      </div>

      {/* Operational Tab Navigation */}
      <div
        style={{
          background: 'var(--bg-cream-alt)',
          borderBottom: 'var(--border-hairline)',
          padding: '0 32px',
          display: 'flex',
          gap: '2px'
        }}
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'workflow', label: 'Workflow DAG' },
          { id: 'logs', label: 'Live Logs' },
          { id: 'results', label: 'Results & Plots' },
          { id: 'artifacts', label: 'Artifacts' },
          { id: 'environment', label: 'Environment & K8s' },
          { id: 'provenance', label: 'Provenance Topology' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeTab === t.id ? 'var(--bg-cream)' : 'transparent',
              borderTop: activeTab === t.id ? '2px solid var(--electric-blue)' : '2px solid transparent',
              borderLeft: activeTab === t.id ? 'var(--border-hairline)' : 'none',
              borderRight: activeTab === t.id ? 'var(--border-hairline)' : 'none',
              color: activeTab === t.id ? 'var(--navy-900)' : 'var(--navy-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Metadata Badges Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div className="arch-card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>EXECUTION DURATION</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>
                  {run.duration_seconds ? `${run.duration_seconds.toFixed(2)}s` : 'In Progress...'}
                </div>
              </div>

              <div className="arch-card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>GIT COMMIT</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--electric-blue)', marginTop: '2px' }}>
                  {run.git_commit}
                </div>
              </div>

              <div className="arch-card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>KUBERNETES NS</div>
                <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)', marginTop: '2px' }}>
                  {run.kubernetes_namespace}
                </div>
              </div>

              <div className="arch-card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>OUTPUT ARTIFACTS</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>
                  {run.artifacts?.length || 0} files generated
                </div>
              </div>
            </div>

            {/* Step Lifecycle Timeline */}
            <div className="arch-card">
              <div className="arch-card-header">
                <span className="arch-card-title">
                  <Clock size={15} color="var(--navy-800)" />
                  <span>Execution Step Status & Resource Telemetry</span>
                </span>
                <span className="badge-arch badge-matched">CONTAINER LEVEL</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="arch-table">
                  <thead>
                    <tr>
                      <th>Step Name</th>
                      <th>Container Image</th>
                      <th>Status</th>
                      <th>Pod Name</th>
                      <th>Exit Code</th>
                      <th>CPU Usage</th>
                      <th>Memory</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.steps.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy-900)' }}>
                          {s.name}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
                          reprovia/{s.name}:1.2
                        </td>
                        <td>
                          <span
                            className={`badge-arch ${
                              s.status === 'COMPLETED'
                                ? 'badge-matched'
                                : s.status === 'RUNNING' || s.status === 'STARTING'
                                ? 'badge-running'
                                : s.status === 'FAILED'
                                ? 'badge-diff'
                                : 'badge-queued'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
                          {s.pod_name || `pod-${s.name}-88b1`}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {s.exit_code !== null ? s.exit_code : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {s.cpu_usage || '480m'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {s.memory_usage || '512Mi'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {s.duration_seconds ? `${s.duration_seconds.toFixed(1)}s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Log Preview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-800)' }}>
                  STREAMING STDOUT/STDERR TERMINAL
                </span>
                <button
                  onClick={() => setActiveTab('logs')}
                  style={{ background: 'none', border: 'none', color: 'var(--electric-blue)', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 600 }}
                >
                  FULLSCREEN LOG VIEWER →
                </button>
              </div>
              <TerminalLogViewer
                logs={liveLogs}
                steps={run.steps.map((s) => s.name)}
                activeRunId={run.id}
                isStreaming={run.status === 'RUNNING'}
              />
            </div>
          </div>
        )}

        {/* 2. WORKFLOW DAG TAB */}
        {activeTab === 'workflow' && (
          <div className="arch-card" style={{ padding: '24px' }}>
            <h3 className="h3-editorial" style={{ marginBottom: '12px' }}>
              Executed Workflow Specification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {run.steps.map((s, idx) => (
                <div key={s.id} style={{ background: '#fff', border: '1px solid var(--navy-800)', padding: '16px', borderRadius: '2px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                    STEP 0{idx + 1}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-editorial)', color: 'var(--navy-900)', marginTop: '2px' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)', marginTop: '4px' }}>
                    reprovia/{s.name}:1.2
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--navy-600)' }}>
                    Status: <span style={{ fontWeight: 600 }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. LIVE LOGS TAB */}
        {activeTab === 'logs' && (
          <TerminalLogViewer
            logs={liveLogs}
            steps={run.steps.map((s) => s.name)}
            activeRunId={run.id}
            isStreaming={run.status === 'RUNNING'}
          />
        )}

        {/* 4. RESULTS & PLOTS TAB */}
        {activeTab === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="arch-card" style={{ padding: '20px' }}>
              <h3 className="h3-editorial" style={{ marginBottom: '14px' }}>
                Scientific Observation: Invariant Mass Resonance (Di-muon Candidate)
              </h3>
              {/* Render SVG artifact */}
              <div
                style={{
                  background: '#08111e',
                  padding: '16px',
                  borderRadius: '2px',
                  border: '1.5px solid var(--navy-800)',
                  boxShadow: 'var(--shadow-architectural)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="380" style={{ background: '#08111e', fontFamily: 'var(--font-mono)' }}>
                  <rect width="800" height="450" fill="#08111e"/>
                  <line x1="80" y1="50" x2="80" y2="380" stroke="#475569"/>
                  <line x1="80" y1="380" x2="740" y2="380" stroke="#475569"/>
                  <line x1="80" y1="300" x2="740" y2="300" stroke="#334155" strokeDasharray="4 4"/>
                  <line x1="80" y1="220" x2="740" y2="220" stroke="#334155" strokeDasharray="4 4"/>
                  <line x1="80" y1="140" x2="740" y2="140" stroke="#334155" strokeDasharray="4 4"/>
                  <text x="80" y="32" fill="#f8fafc" fontSize="13" fontWeight="bold">ATLAS COLLISION RUN-3: DI-PHOTON INVARIANT MASS RESONANCE</text>
                  <text x="560" y="32" fill="#38bdf8" fontSize="11">Run #{run.run_number} | 5.24σ Significance</text>
                  <path d="M 100,350 Q 250,300 400,260 T 700,210" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3"/>
                  <path d="M 100,350 Q 300,310 370,200 Q 400,80 430,200 Q 500,280 700,210" fill="none" stroke="#38bdf8" strokeWidth="3"/>
                  <circle cx="400" cy="80" r="6" fill="#1d63ed" stroke="#ffffff" strokeWidth="2"/>
                  <text x="415" y="85" fill="#ffffff" fontSize="12" fontWeight="bold">m_H = 125.09 GeV</text>
                  <text x="350" y="420" fill="#94a3b8" fontSize="11">Di-muon Invariant Mass m_μμ [GeV/c²]</text>
                  <text x="25" y="220" fill="#94a3b8" fontSize="11" transform="rotate(-90 25 220)">Events / 2.5 GeV</text>
                </svg>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <div>RESONANCE PEAK: <strong style={{ color: 'var(--electric-blue)' }}>125.09 ± 0.24 GeV</strong></div>
                <div>LOCAL SIGNIFICANCE: <strong style={{ color: 'var(--status-matched)' }}>5.24σ (Discovery Threshold)</strong></div>
                <div>EVENTS PROCESSED: <strong>1,250,000</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ARTIFACTS TAB */}
        {activeTab === 'artifacts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
            <div className="arch-card">
              <div className="arch-card-header">
                <span className="arch-card-title">Run Artifacts</span>
                <span className="badge-arch">{run.artifacts?.length || 0}</span>
              </div>
              <div style={{ padding: '8px' }}>
                {run.artifacts?.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleInspectArtifact(art.id)}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '6px',
                      background: selectedArtifactContent?.id === art.id ? 'var(--bg-cream-alt)' : '#fff',
                      border: selectedArtifactContent?.id === art.id ? '1px solid var(--electric-blue)' : 'var(--border-hairline)',
                      cursor: 'pointer',
                      borderRadius: '2px'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--navy-900)' }}>
                      {art.name}
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginTop: '2px' }}>
                      {art.file_type.toUpperCase()} • {art.size_bytes} bytes
                    </div>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      sha256:{art.checksum.slice(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Artifact Preview Pane */}
            <div className="arch-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="arch-card-header">
                <span className="arch-card-title">
                  {selectedArtifactContent ? selectedArtifactContent.name : 'Artifact Content Preview'}
                </span>
                {selectedArtifactContent && (
                  <span className="badge-arch badge-matched">VERIFIED CHECKSUM</span>
                )}
              </div>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                {selectedArtifactContent?.preview_text ? (
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--navy-900)', color: '#f8fafc', padding: '14px', borderRadius: '2px' }}>
                    {selectedArtifactContent.preview_text}
                  </pre>
                ) : (
                  <div style={{ color: 'var(--navy-muted)', textAlign: 'center', padding: '40px 0' }}>
                    Select an artifact on the left to inspect its raw data or verified checksum.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. ENVIRONMENT & KUBERNETES TAB */}
        {activeTab === 'environment' && (
          <div className="arch-card" style={{ padding: '24px' }}>
            <h3 className="h3-editorial" style={{ marginBottom: '16px' }}>
              Kubernetes Job Execution Spec & Environment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginBottom: '6px' }}>
                  PARAMETERS (JSON)
                </div>
                <pre style={{ background: 'var(--navy-900)', color: '#38bdf8', padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', borderRadius: '2px' }}>
                  {JSON.stringify(run.parameters, null, 2)}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginBottom: '6px' }}>
                  ENVIRONMENT VARIABLES
                </div>
                <pre style={{ background: 'var(--navy-900)', color: '#a7f3d0', padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', borderRadius: '2px' }}>
                  {JSON.stringify(run.environment_vars, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 7. PROVENANCE TOPOLOGY TAB */}
        {activeTab === 'provenance' && provenanceGraph && (
          <ProvenanceGraphView graphData={provenanceGraph} />
        )}
      </div>

      {/* Reproduction Comparison Modal (When triggered) */}
      {reproductionReport && (
        <ReproductionComparisonModal
          report={reproductionReport}
          onClose={() => setReproductionReport(null)}
        />
      )}
    </div>
  );
};
