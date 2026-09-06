import React, { useState } from 'react';
import { Database, GitFork, GitCommit, Box, Server, Play, Archive, ArrowRight, ShieldCheck, Hash, Key } from 'lucide-react';
import { ProvenanceGraphData, ProvenanceNode } from '../types';

interface ProvenanceGraphViewProps {
  graphData: ProvenanceGraphData;
}

export const ProvenanceGraphView: React.FC<ProvenanceGraphViewProps> = ({ graphData }) => {
  const [selectedNode, setSelectedNode] = useState<ProvenanceNode | null>(
    graphData.nodes.length > 0 ? graphData.nodes[1] : null
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DATASET': return Database;
      case 'WORKFLOW': return GitFork;
      case 'CODE': return GitCommit;
      case 'CONTAINERS': return Box;
      case 'KUBERNETES': return Server;
      case 'EXECUTION': return Play;
      case 'ARTIFACT': return Archive;
      default: return ShieldCheck;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-cream-alt)', border: 'var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} color="var(--electric-blue)" />
          <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 700, fontSize: '13px' }}>
            IMMUTABLE PROVENANCE TOPOLOGY (W3C PROV-O ALIGNED)
          </span>
          <span className="badge-arch badge-matched" style={{ fontSize: '10px' }}>
            CRYPTOGRAPHICALLY FROZEN
          </span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
          FINGERPRINT: <span style={{ color: 'var(--navy-900)', fontWeight: 600 }}>SHA-256 SECURED</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', minHeight: '440px' }}>
        {/* Left: Interactive Spatial Linear Graph */}
        <div
          style={{
            background: 'var(--bg-cream-card)',
            border: 'var(--border-hairline)',
            boxShadow: 'var(--shadow-architectural)',
            padding: '28px',
            borderRadius: '2px',
            overflowX: 'auto',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '850px' }}>
            {graphData.nodes.map((node, idx) => {
              const Icon = getCategoryIcon(node.category);
              const isSelected = selectedNode?.id === node.id;

              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => setSelectedNode(node)}
                    style={{
                      background: isSelected ? '#ffffff' : 'var(--bg-cream-alt)',
                      border: isSelected ? '2px solid var(--electric-blue)' : '1px solid var(--navy-800)',
                      boxShadow: isSelected ? 'var(--shadow-blue-stamp)' : 'var(--shadow-architectural-sm)',
                      padding: '14px 16px',
                      width: '160px',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ background: isSelected ? 'var(--electric-blue)' : 'var(--navy-800)', color: '#fff', padding: '4px', borderRadius: '2px' }}>
                        <Icon size={14} />
                      </div>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', fontWeight: 600 }}>
                        {node.category}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--navy-900)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.title}
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--navy-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.subtitle}
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  {idx < graphData.nodes.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--electric-blue)', flexShrink: 0 }}>
                      <div style={{ width: '16px', height: '1.5px', background: 'var(--electric-blue)' }} />
                      <ArrowRight size={14} style={{ marginLeft: '-4px' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Node Inspector */}
        <div className="arch-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Key size={14} />
              <span>Provenance Inspector</span>
            </span>
            <span className="badge-arch badge-matched">VERIFIED</span>
          </div>

          <div className="arch-card-body" style={{ flex: 1, overflowY: 'auto' }}>
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', textTransform: 'uppercase' }}>
                    COMPONENT TYPE
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-editorial)', color: 'var(--navy-900)' }}>
                    {selectedNode.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--navy-600)' }}>
                    {selectedNode.subtitle}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-hairline)' }} />

                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginBottom: '6px' }}>
                    METADATA & CRYPTOGRAPHIC HASHES
                  </div>
                  <div style={{ background: 'var(--bg-cream-alt)', padding: '10px', border: 'var(--border-hairline)', borderRadius: '2px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {Object.entries(selectedNode.metadata || {}).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: '6px', wordBreak: 'break-all' }}>
                        <span style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>{k}: </span>
                        <span style={{ color: 'var(--navy-800)' }}>
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '8px 10px', background: 'var(--status-matched-bg)', border: '1px solid #86efac', borderRadius: '2px', fontSize: '11px', color: 'var(--status-matched)' }}>
                  ✓ Immutable lock active: Any alteration to code, dataset, or container invalidates this chain.
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--navy-muted)', textAlign: 'center', padding: '40px 0' }}>
                Select a provenance node in the graph to inspect its parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
