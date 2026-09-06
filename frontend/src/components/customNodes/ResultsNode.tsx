import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle, FileText } from 'lucide-react';

export const ResultsNode = memo(({ data }: { data: any }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid var(--status-matched)',
        boxShadow: 'var(--shadow-architectural-sm)',
        borderRadius: '2px',
        width: '210px',
        fontSize: '12px',
        overflow: 'hidden'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#166534', width: '8px', height: '8px' }} />
      <div
        style={{
          background: 'var(--status-matched-bg)',
          color: 'var(--status-matched)',
          padding: '6px 10px',
          borderBottom: '1px solid #86efac',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-editorial)',
          fontWeight: 700
        }}
      >
        <CheckCircle size={14} />
        <span>{data.label || 'Artifacts & Results'}</span>
      </div>
      <div style={{ padding: '8px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-700)' }}>
        {(data.outputs || ['/results']).map((out: string, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            <FileText size={10} color="var(--navy-muted)" />
            <span>{out}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
