import React, { useEffect, useState } from 'react';
import { PlayCircle, CheckCircle, XCircle, RotateCcw, ArrowUpRight, Search, Filter, ShieldCheck, GitCompare, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { RunItem, ReproductionReport } from '../types';
import { ReproductionComparisonModal } from '../components/ReproductionComparisonModal';

interface RunsViewProps {
  onNavigate: (tab: string, runId?: string) => void;
}

export const RunsView: React.FC<RunsViewProps> = ({ onNavigate }) => {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [comparisonReport, setComparisonReport] = useState<ReproductionReport | null>(null);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await api.listRuns();
      setRuns(data);
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleQuickCompare = async (originalRunId: string, reproducedRunId: string) => {
    try {
      const report = await api.compareRuns(originalRunId, reproducedRunId);
      setComparisonReport(report);
    } catch (err) {
      console.error('Failed to compare runs:', err);
    }
  };

  const filteredRuns = runs.filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchTerm && !r.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) && !r.run_number.toString().includes(searchTerm)) return false;
    return true;
  });

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            EXECUTION ENGINE TELEMETRY
          </div>
          <h2 className="h2-editorial">Computational Runs</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-reprovia-secondary" onClick={fetchRuns}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn-reprovia-primary" onClick={() => onNavigate('builder')}>
            <span>Launch New Run</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-cream-card)', padding: '12px 18px', border: 'var(--border-hairline)', boxShadow: 'var(--shadow-architectural-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>STATUS:</span>
          {['ALL', 'COMPLETED', 'RUNNING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className="btn-reprovia-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: filterStatus === st ? 'var(--navy-800)' : 'var(--bg-cream-card)',
                color: filterStatus === st ? '#ffffff' : 'var(--navy-800)'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-cream)', padding: '6px 12px', border: 'var(--border-hairline)' }}>
          <Search size={13} color="var(--navy-muted)" />
          <input
            type="text"
            placeholder="Search by run # or workflow..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              width: '240px'
            }}
          />
        </div>
      </div>

      {/* Runs Table */}
      <div className="arch-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="arch-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Run Index</th>
                <th>Workflow Name</th>
                <th style={{ width: '130px' }}>Lifecycle Status</th>
                <th>Researcher / Trigger</th>
                <th>Git Commit</th>
                <th>Namespace</th>
                <th>Duration</th>
                <th>Started At</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Operational Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--navy-muted)' }}>
                    {loading ? 'Loading computational runs...' : 'No execution runs found.'}
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy-900)' }}>
                      Run #{run.run_number}
                      {run.reproduction_of_run_id && (
                        <div style={{ fontSize: '9px', color: 'var(--electric-blue)', fontWeight: 500 }}>
                          ↺ Repro of Run
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                      {run.workflow_name}
                    </td>
                    <td>
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
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--navy-700)' }}>
                      {run.triggered_by}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
                      [{run.git_commit}]
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
                      {run.kubernetes_namespace}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : 'N/A'}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>
                      {run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'Queued'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {run.reproduction_of_run_id && run.status === 'COMPLETED' && (
                          <button
                            className="btn-reprovia-secondary"
                            style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--electric-blue)', borderColor: 'var(--electric-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleQuickCompare(run.reproduction_of_run_id!, run.id)}
                            title="Compare against baseline run"
                          >
                            <GitCompare size={11} />
                            <span>Compare</span>
                          </button>
                        )}
                        <button
                          className="btn-reprovia-secondary"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => onNavigate('run-detail', run.id)}
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Comparison Modal */}
      {comparisonReport && (
        <ReproductionComparisonModal
          report={comparisonReport}
          onClose={() => setComparisonReport(null)}
        />
      )}
    </div>
  );
};
