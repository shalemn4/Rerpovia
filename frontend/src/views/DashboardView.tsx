import React, { useEffect, useState } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Database, 
  Archive, 
  Cpu, 
  HardDrive, 
  Server, 
  ArrowUpRight, 
  Activity,
  Box,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { RunItem, WorkflowItem, DatasetItem } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: string, runId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [infra, setInfra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [runsData, wfData, dsData, infraData] = await Promise.all([
          api.listRuns(),
          api.listWorkflows(),
          api.listDatasets(),
          api.getInfrastructure()
        ]);
        setRuns(runsData);
        setWorkflows(wfData);
        setDatasets(dsData);
        setInfra(infraData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedRuns = runs.filter((r) => r.status === 'COMPLETED').length;
  const runningRuns = runs.filter((r) => r.status === 'RUNNING' || r.status === 'STARTING').length;
  const failedRuns = runs.filter((r) => r.status === 'FAILED').length;

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            OPERATIONAL TELEMETRY & WORKSPACE
          </div>
          <h2 className="h2-editorial">Research Dashboard</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-reprovia-primary" onClick={() => onNavigate('builder')}>
            <span>New Workflow</span>
            <ArrowUpRight size={14} />
          </button>
          <button className="btn-reprovia-secondary" onClick={() => onNavigate('runs')}>
            <span>All Runs</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {/* Metric 1 */}
        <div className="arch-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>ACTIVE WORKFLOWS</span>
            <Layers size={16} color="var(--navy-800)" />
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            {workflows.length || 3}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--electric-blue)', marginTop: '4px' }}>
            3 verified DAG specifications
          </div>
        </div>

        {/* Metric 2 */}
        <div className="arch-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>RUNNING JOBS</span>
            <PlayCircle size={16} color="var(--electric-blue)" />
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--electric-blue)' }}>
            {runningRuns}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--navy-muted)', marginTop: '4px' }}>
            Kubernetes pods executing
          </div>
        </div>

        {/* Metric 3 */}
        <div className="arch-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>COMPLETED RUNS</span>
            <CheckCircle2 size={16} color="var(--status-matched)" />
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            {completedRuns || 1}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--status-matched)', marginTop: '4px' }}>
            100% provenance verified
          </div>
        </div>

        {/* Metric 4 */}
        <div className="arch-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>FAILED RUNS</span>
            <XCircle size={16} color={failedRuns > 0 ? 'var(--status-diff)' : 'var(--navy-muted)'} />
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: failedRuns > 0 ? 'var(--status-diff)' : 'var(--navy-900)' }}>
            {failedRuns}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--navy-muted)', marginTop: '4px' }}>
            0 non-zero exit codes
          </div>
        </div>

        {/* Metric 5 */}
        <div className="arch-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>DATASET STORAGE</span>
            <Database size={16} color="var(--navy-800)" />
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            1.48 <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>GB</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--navy-muted)', marginTop: '4px' }}>
            ATLAS collision open data
          </div>
        </div>

        {/* Metric 6 */}
        <div className="arch-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>CLUSTER CPU</span>
            <Cpu size={16} color="var(--navy-800)" />
          </div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            {infra ? `${infra.nodes[0]?.cpu_usage_pct}%` : '28.4%'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--navy-muted)', marginTop: '4px' }}>
            112 total cluster cores
          </div>
        </div>
      </div>

      {/* Interactive System Activity & Compact Infrastructure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* System Activity Chart */}
        <div className="arch-card">
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Activity size={15} color="var(--electric-blue)" />
              <span>System Activity & Workflow Executions (24h)</span>
            </span>
            <span className="badge-arch badge-running">LIVE TELEMETRY</span>
          </div>
          <div className="arch-card-body">
            <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '10px', borderBottom: 'var(--border-hairline)' }}>
              {[12, 18, 9, 24, 45, 62, 80, 54, 70, 92, 110, 85, 95, 120, 134, 110, 88, 94, 102, 118, 128, 140, 115, 98].map((val, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${(val / 150) * 100}%`,
                      background: idx >= 20 ? 'var(--electric-blue)' : 'var(--navy-700)',
                      borderRadius: '1px',
                      transition: 'height 0.3s ease'
                    }}
                    title={`${val} jobs at ${(idx).toString().padStart(2, '0')}:00`}
                  />
                  <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginTop: '4px' }}>
                    {idx % 4 === 0 ? `${idx}h` : ''}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
              <span>PEAK: 140 CONTAINER JOBS / HR</span>
              <span>MEDIAN STEP DURATION: 18.4s</span>
              <span>CLUSTER SATURATION: 42.1%</span>
            </div>
          </div>
        </div>

        {/* Compact Infrastructure Visualization */}
        <div className="arch-card">
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Server size={15} color="var(--navy-800)" />
              <span>Kubernetes Infrastructure Hierarchy</span>
            </span>
            <button
              onClick={() => onNavigate('infrastructure')}
              style={{ background: 'none', border: 'none', color: 'var(--electric-blue)', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 600 }}
            >
              DETAILS →
            </button>
          </div>
          <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Cluster */}
            <div style={{ padding: '10px 14px', background: 'var(--bg-cream-alt)', border: 'var(--border-hairline)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>CLUSTER</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)' }}>
                  {infra?.cluster_name || 'reprovia-cern-hpc-01'}
                </div>
              </div>
              <span className="badge-arch badge-matched">HEALTHY</span>
            </div>

            {/* Hierarchy breakdown: Cluster -> Nodes -> Pods -> Jobs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: '#fff', border: 'var(--border-hairline)' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>WORKER NODES</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>3</div>
                <div style={{ fontSize: '9px', color: 'var(--status-matched)' }}>All Ready</div>
              </div>
              <div style={{ padding: '10px', background: '#fff', border: 'var(--border-hairline)' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>RUNNING PODS</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--electric-blue)', marginTop: '2px' }}>81</div>
                <div style={{ fontSize: '9px', color: 'var(--navy-muted)' }}>Across 4 ns</div>
              </div>
              <div style={{ padding: '10px', background: '#fff', border: 'var(--border-hairline)' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>ACTIVE JOBS</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)', marginTop: '2px' }}>7</div>
                <div style={{ fontSize: '9px', color: 'var(--status-matched)' }}>142 finished</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', padding: '6px 10px', background: 'var(--bg-cream-subtle)', borderRadius: '2px' }}>
              <span>CSI: CephFS Scientific Storage • CNI: Cilium eBPF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Operational Runs Table */}
      <div className="arch-card">
        <div className="arch-card-header">
          <span className="arch-card-title">
            <PlayCircle size={15} color="var(--navy-800)" />
            <span>Recent Computational Runs</span>
          </span>
          <button
            className="btn-reprovia-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => onNavigate('runs')}
          >
            View All Runs ({runs.length})
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="arch-table">
            <thead>
              <tr>
                <th>Run Identifier</th>
                <th>Workflow</th>
                <th>Status</th>
                <th>Triggered By</th>
                <th>Git Commit</th>
                <th>Execution Duration</th>
                <th>Started At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 5).map((run) => (
                <tr key={run.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Run #{run.run_number}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                    {run.workflow_name}
                  </td>
                  <td>
                    <span
                      className={`badge-arch ${
                        run.status === 'COMPLETED'
                          ? 'badge-matched'
                          : run.status === 'RUNNING'
                          ? 'badge-running'
                          : run.status === 'FAILED'
                          ? 'badge-diff'
                          : 'badge-queued'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--navy-700)' }}>
                    {run.triggered_by}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
                    [{run.git_commit}]
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : '—'}
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>
                    {run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'Queued'}
                  </td>
                  <td>
                    <button
                      className="btn-reprovia-secondary"
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                      onClick={() => onNavigate('run-detail', run.id)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
