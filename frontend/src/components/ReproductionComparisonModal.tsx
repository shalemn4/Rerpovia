import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, HelpCircle, ArrowRight, ShieldAlert, GitCompare, Download, Copy, Check } from 'lucide-react';
import { ReproductionReport } from '../types';

interface ReproductionComparisonModalProps {
  report: ReproductionReport;
  onClose: () => void;
}

export const ReproductionComparisonModal: React.FC<ReproductionComparisonModalProps> = ({ report, onClose }) => {
  const isMatched = report.overall_verdict === 'MATCHED';
  const isDifferent = report.overall_verdict === 'DIFFERENT';
  const [copied, setCopied] = useState(false);

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `reprovia_report_run${report.original_run_number}_vs_run${report.reproduced_run_number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    const md = `# REPROVIA Scientific Reproduction Verification Certificate

**Baseline Run:** #${report.original_run_number} (${report.original_run_id})
**Reproduction Run:** #${report.reproduced_run_number} (${report.reproduced_run_id})
**Overall Verdict:** ${report.summary_verdict} (${report.overall_verdict})
**Duration Delta:** ${report.duration_difference_seconds !== null ? report.duration_difference_seconds + 's' : 'N/A'}

## Evaluation Matrix

| Vector | Status | Baseline | Reproduction | Notes |
|---|---|---|---|---|
${report.comparison_matrix.map(m => `| ${m.category} | ${m.status} | ${m.original_value} | ${m.reproduced_value} | ${m.details} |`).join('\n')}

---
*Cryptographically verified by REPROVIA Reproducible Science Infrastructure.*
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(8, 17, 30, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px'
      }}
    >
      <div
        className="arch-card"
        style={{
          width: '950px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          boxShadow: '12px 12px 0px rgba(12, 25, 44, 0.95)'
        }}
      >
        {/* Modal Header */}
        <div className="arch-card-header" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitCompare size={20} color="var(--electric-blue)" />
            <div>
              <div className="arch-card-title" style={{ fontSize: '1.2rem' }}>
                Scientific Reproduction Verification Report
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                Comparing Baseline Run #{report.original_run_number} against Reproduction Run #{report.reproduced_run_number}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Verdict Banner */}
        <div
          style={{
            padding: '16px 24px',
            background: isMatched ? 'var(--status-matched-bg)' : isDifferent ? 'var(--status-diff-bg)' : 'var(--status-inconclusive-bg)',
            borderBottom: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMatched ? (
              <CheckCircle size={28} color="var(--status-matched)" />
            ) : isDifferent ? (
              <AlertTriangle size={28} color="var(--status-diff)" />
            ) : (
              <HelpCircle size={28} color="var(--status-inconclusive)" />
            )}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-editorial)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: isMatched ? 'var(--status-matched)' : isDifferent ? 'var(--status-diff)' : 'var(--status-inconclusive)'
                }}
              >
                VERDICT: {report.summary_verdict} ({report.overall_verdict})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--navy-700)' }}>
                {isMatched
                  ? 'All computational inputs, container layers, and output telemetry converged within strict statistical epsilon.'
                  : 'Differences observed between original baseline and reproduced run results.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleCopyMarkdown}
              className="btn-reprovia-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {copied ? <Check size={12} color="var(--status-matched)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied MD' : 'Copy MD'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="btn-reprovia-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={12} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <table className="arch-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Provenance Vector</th>
                <th style={{ width: '110px' }}>Verdict</th>
                <th>Original Run #{report.original_run_number}</th>
                <th>Reproduction Run #{report.reproduced_run_number}</th>
                <th>Evaluation Details</th>
              </tr>
            </thead>
            <tbody>
              {report.comparison_matrix.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)' }}>
                    {item.category}
                  </td>
                  <td>
                    <span
                      className={`badge-arch ${
                        item.status === 'MATCHED'
                          ? 'badge-matched'
                          : item.status === 'DIFFERENT'
                          ? 'badge-diff'
                          : 'badge-inconclusive'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-800)' }}>
                    {item.original_value}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-800)' }}>
                    {item.reproduced_value}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--navy-600)' }}>
                    {item.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--bg-cream-alt)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
            REPROVIA EVALUATOR v1.0 • CERN OPEN SCIENCE COMPUTING STANDARDS
          </span>
          <button className="btn-reprovia-primary" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
