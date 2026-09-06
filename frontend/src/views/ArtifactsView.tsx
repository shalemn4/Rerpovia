import React, { useState } from 'react';
import { Archive, FileText, Download, CheckCircle, ExternalLink, Code, Eye } from 'lucide-react';

export const ArtifactsView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('summary.json');

  const artifacts = [
    { name: 'summary.json', type: 'json', size: '3.4 KB', checksum: '7f83b1657ff1fc53b92dc18148a1d65d', run: 'Run #184' },
    { name: 'analysis.csv', type: 'csv', size: '14.2 KB', checksum: 'a84f3c9e112d8a435b8813bcfe7842c1', run: 'Run #184' },
    { name: 'histogram.svg', type: 'svg', size: '28.1 KB', checksum: '1a84f3c955e8bc4219a1fc4498aa2b10', run: 'Run #184' },
    { name: 'report.pdf', type: 'pdf', size: '412 KB', checksum: 'e3b0c44298fc1c149afbf4c8996fb924', run: 'Run #184' }
  ];

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            IMMUTABLE OUTPUT ARTIFACT STORE
          </div>
          <h2 className="h2-editorial">Artifact Tree & Previews</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Artifact Directory Tree */}
        <div className="arch-card">
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Archive size={14} />
              <span>results/</span>
            </span>
            <span className="badge-arch badge-matched">4 ARTIFACTS</span>
          </div>
          <div style={{ padding: '12px' }}>
            {artifacts.map((art) => (
              <div
                key={art.name}
                onClick={() => setSelectedFile(art.name)}
                style={{
                  padding: '10px 12px',
                  marginBottom: '8px',
                  background: selectedFile === art.name ? 'var(--bg-cream-alt)' : '#fff',
                  border: selectedFile === art.name ? '1.5px solid var(--electric-blue)' : 'var(--border-hairline)',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--navy-900)' }}>
                    {art.name}
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                    {art.size}
                  </span>
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginTop: '4px' }}>
                  sha256:{art.checksum.slice(0, 12)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Artifact Preview */}
        <div className="arch-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Eye size={14} />
              <span>Preview: {selectedFile}</span>
            </span>
            <span className="badge-arch badge-matched">SHA-256 VERIFIED</span>
          </div>
          <div className="arch-card-body" style={{ flex: 1, overflowY: 'auto' }}>
            {selectedFile === 'summary.json' && (
              <pre style={{ background: 'var(--navy-900)', color: '#38bdf8', padding: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', borderRadius: '2px' }}>
{`{
  "run_id": "run-184-cern-baseline",
  "experiment": "particle-collision-analysis",
  "convergence_sigma": 5.24,
  "resonance_peak_gev": 125.09,
  "events_processed": 1250000,
  "detector_snr_db": 4.82,
  "computational_nodes": 4,
  "reproducibility_fingerprint": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}`}
              </pre>
            )}

            {selectedFile === 'analysis.csv' && (
              <table className="arch-table">
                <thead>
                  <tr>
                    <th>Bin</th>
                    <th>Energy Bin (GeV)</th>
                    <th>Signal Counts</th>
                    <th>Background</th>
                    <th>Uncertainty</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['01', '110.0-112.5', '420', '412', '±20.5'],
                    ['02', '112.5-115.0', '490', '465', '±22.1'],
                    ['03', '115.0-117.5', '610', '540', '±24.7'],
                    ['04', '117.5-120.0', '850', '680', '±29.1'],
                    ['05', '120.0-122.5', '1340', '890', '±36.6'],
                    ['06', '122.5-125.0', '2450', '1105', '±49.5'],
                    ['07', '125.0-127.5', '2890', '1130', '±53.8'],
                    ['08', '127.5-130.0', '1920', '950', '±43.8']
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r[0]}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r[1]}</td>
                      <td style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>{r[2]}</td>
                      <td>{r[3]}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>{r[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedFile === 'histogram.svg' && (
              <div style={{ background: '#08111e', padding: '16px', borderRadius: '2px', border: '1.5px solid var(--navy-800)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="340" style={{ background: '#08111e', fontFamily: 'var(--font-mono)' }}>
                  <rect width="800" height="450" fill="#08111e"/>
                  <line x1="80" y1="50" x2="80" y2="380" stroke="#475569"/>
                  <line x1="80" y1="380" x2="740" y2="380" stroke="#475569"/>
                  <text x="80" y="32" fill="#f8fafc" fontSize="13" fontWeight="bold">REPROVIA OBSERVATION: INVARIANT MASS DIPHOTON RESONANCE</text>
                  <path d="M 100,350 Q 300,310 370,200 Q 400,80 430,200 Q 500,280 700,210" fill="none" stroke="#38bdf8" strokeWidth="3"/>
                  <circle cx="400" cy="80" r="6" fill="#1d63ed" stroke="#ffffff" strokeWidth="2"/>
                  <text x="415" y="85" fill="#ffffff" fontSize="12" fontWeight="bold">m_H = 125.09 GeV (5.24σ)</text>
                </svg>
              </div>
            )}

            {selectedFile === 'report.pdf' && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--navy-muted)' }}>
                <FileText size={48} color="var(--navy-800)" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>CERN-REPROVIA-REPORT-2026.pdf</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  Cryptographically signed scientific preprint (412 KB)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
