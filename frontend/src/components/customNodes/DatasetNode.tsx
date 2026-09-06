import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database } from 'lucide-react';

export const DatasetNode = memo(({ data }: { data: any }) => {
  return (
    <div
      style={{
        background: 'var(--bg-cream-card)',
        border: '1.5px dashed var(--navy-800)',
        boxShadow: 'var(--shadow-architectural-sm)',
        borderRadius: '2px',
        width: '200px',
        fontSize: '12px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          background: 'var(--bg-cream-subtle)',
          padding: '6px 10px',
          borderBottom: 'var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-editorial)',
          fontWeight: 700
        }}
      >
        <Database size={13} color="var(--navy-800)" />
        <span>{data.label || 'Input Datasets'}</span>
      </div>
      <div style={{ padding: '8px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
        {Object.entries(data.inputs || {}).map(([k, v]) => (
          <div key={k} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {k}: {String(v)}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#0c192c', width: '8px', height: '8px' }} />
    </div>
  );
});
