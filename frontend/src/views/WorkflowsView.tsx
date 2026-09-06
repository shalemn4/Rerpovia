import React, { useEffect, useState } from 'react';
import { GitFork, Plus, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api/client';
import { WorkflowItem } from '../types';

interface WorkflowsViewProps {
  onNavigate: (tab: string, runId?: string) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({ onNavigate }) => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listWorkflows();
        setWorkflows(data);
      } catch (err) {
        console.error('Failed to load workflows:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            REPRODUCIBLE COMPUTATIONAL PIPELINES
          </div>
          <h2 className="h2-editorial">Scientific Workflows</h2>
        </div>

        <button className="btn-reprovia-primary" onClick={() => onNavigate('builder')}>
          <Plus size={14} />
          <span>Create New Workflow</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {workflows.map((wf) => (
          <div key={wf.id} className="arch-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="arch-card-header">
              <span className="arch-card-title">
                <GitFork size={15} />
                <span>{wf.name}</span>
              </span>
              <span className="badge-arch badge-matched">v{wf.version}.0</span>
            </div>

            <div className="arch-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--navy-600)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {wf.description || 'Standard reproducible computational research DAG.'}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {wf.tags.map((tag) => (
                    <span key={tag} className="badge-arch" style={{ background: 'var(--bg-cream-alt)', fontSize: '10px' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--border-hairline)', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                  UPDATED: {new Date(wf.updated_at).toLocaleDateString()}
                </span>
                <button
                  className="btn-reprovia-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => onNavigate('builder')}
                >
                  <span>Open in Builder</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
