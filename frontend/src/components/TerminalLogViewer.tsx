import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Pause, Play, Trash2, Filter } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalLogViewerProps {
  logs: LogEntry[];
  steps: string[];
  activeRunId: string;
  isStreaming?: boolean;
}

export const TerminalLogViewer: React.FC<TerminalLogViewerProps> = ({
  logs,
  steps,
  activeRunId,
  isStreaming = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStep, setSelectedStep] = useState<string>('all');
  const [streamFilter, setStreamFilter] = useState<'all' | 'stdout' | 'stderr'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (selectedStep !== 'all' && l.step_name !== selectedStep) return false;
    if (streamFilter !== 'all' && l.stream !== streamFilter) return false;
    if (searchTerm && !l.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleDownload = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.step_name}] [${l.stream}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reprovia-run-${activeRunId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="terminal-container" style={{ width: '100%', height: '480px' }}>
      {/* Terminal Toolbar */}
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>

          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            RUN LOG TELEMETRY {isStreaming && <span style={{ color: '#38bdf8', marginLeft: '6px' }}>● LIVE STREAM</span>}
          </span>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Step Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '2px' }}>
            <Filter size={11} color="#94a3b8" />
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              style={{
                background: 'transparent',
                color: '#e2e8f0',
                border: 'none',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ background: '#0c192c' }}>All Steps</option>
              {steps.map((s) => (
                <option key={s} value={s} style={{ background: '#0c192c' }}>{s}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '2px' }}>
            <Search size={11} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                width: '110px'
              }}
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              background: autoScroll ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: autoScroll ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '3px 8px',
              borderRadius: '2px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {autoScroll ? <Pause size={10} /> : <Play size={10} />}
            <span>{autoScroll ? 'Pause Scroll' : 'Follow'}</span>
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownload}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '3px 8px',
              borderRadius: '2px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Download full log dump"
          >
            <Download size={10} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Terminal Log Lines */}
      <div
        ref={logContainerRef}
        className="terminal-body"
        style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
            No log lines recorded for this step or filter criteria.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="log-line" style={{ marginBottom: '4px' }}>
              <span className="log-timestamp">[{log.timestamp || '00:00:00'}]</span>
              <span className="log-step-tag">[{log.step_name}]</span>
              <span className={log.stream === 'stderr' ? 'log-content-stderr' : 'log-content-stdout'}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer */}
      <div
        style={{
          background: 'var(--navy-800)',
          padding: '4px 16px',
          borderTop: '1px solid var(--navy-700)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#64748b'
        }}
      >
        <span>LINES: {filteredLogs.length} / {logs.length} TOTAL</span>
        <span>ENCODING: UTF-8 • ANSI STRIPPED</span>
      </div>
    </div>
  );
};
