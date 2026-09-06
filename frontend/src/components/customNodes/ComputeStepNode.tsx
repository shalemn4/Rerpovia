import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Cpu, HardDrive, Terminal } from 'lucide-react';

export interface ComputeStepData {
  label: string;
  image: string;
  command: string;
  resources: {
    cpu_request?: string;
    memory_request?: string;
    cpu_limit?: string;
    memory_limit?: string;
  };
  nodeType: string;
  status?: string;
}

export const ComputeStepNode = memo(({ data, selected }: { data: ComputeStepData; selected: boolean }) => {
  const isRunning = data.status === 'RUNNING';
  const isCompleted = data.status === 'COMPLETED';
  const isFailed = data.status === 'FAILED';

  let borderStyle = '1.5px solid var(--navy-800)';
  if (selected) borderStyle = '2px solid var(--electric-blue)';
  if (isRunning) borderStyle = '2px solid var(--electric-blue)';
  if (isCompleted) borderStyle = '2px solid var(--status-matched)';
  if (isFailed) borderStyle = '2px solid var(--status-diff)';

  return (
    <div
      style={{
        background: '#ffffff',
        border: borderStyle,
        boxShadow: selected ? 'var(--shadow-blue-stamp)' : 'var(--shadow-architectural)',
        borderRadius: '2px',
        width: '240px',
        fontSize: '12px',
        overflow: 'hidden',
        transition: 'all 0.15s ease'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#0c192c', width: '8px', height: '8px' }} />
      
      {/* Node Header */}
      <div
        style={{
          background: 'var(--bg-cream-alt)',
          padding: '8px 12px',
          borderBottom: 'var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontFamily: 'var(--font-editorial)' }}>
          <Box size={14} color="var(--navy-800)" />
          <span>{data.label}</span>
        </div>
        {data.status && (
          <span
            className={`badge-arch ${
              isCompleted ? 'badge-matched' : isRunning ? 'badge-running' : isFailed ? 'badge-diff' : ''
            }`}
            style={{ fontSize: '9px', padding: '1px 5px' }}
          >
            {data.status}
          </span>
        )}
      </div>

      {/* Node Body */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--navy-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <Terminal size={12} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.image}>
            {data.image}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '10px', color: 'var(--navy-700)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-cream)', padding: '2px 5px', border: 'var(--border-hairline)' }}>
            <Cpu size={10} />
            <span>{data.resources?.cpu_limit || '1000m'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-cream)', padding: '2px 5px', border: 'var(--border-hairline)' }}>
            <HardDrive size={10} />
            <span>{data.resources?.memory_limit || '1Gi'}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: '#1d63ed', width: '8px', height: '8px' }} />
    </div>
  );
});
