import React, { useEffect, useState } from 'react';
import { Database, Upload, FileText, CheckCircle, ShieldCheck, Tag, User } from 'lucide-react';
import { api } from '../api/client';
import { DatasetItem } from '../types';

export const DatasetsView: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listDatasets();
        setDatasets(data);
        if (data.length > 0) setSelectedDataset(data[0]);
      } catch (err) {
        console.error('Failed to load datasets:', err);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            IMMUTABLE RESEARCH DATASETS & VERSIONING
          </div>
          <h2 className="h2-editorial">Dataset Registry</h2>
        </div>

        <button className="btn-reprovia-primary">
          <Upload size={14} />
          <span>Upload Dataset Version</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Datasets List */}
        <div className="arch-card">
          <div className="arch-card-header">
            <span className="arch-card-title">Registered Datasets ({datasets.length})</span>
            <span className="badge-arch badge-matched">LINEAGE SECURED</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="arch-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Version</th>
                  <th>Size</th>
                  <th>Owner</th>
                  <th>Checksum</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => (
                  <tr
                    key={ds.id}
                    onClick={() => setSelectedDataset(ds)}
                    style={{
                      cursor: 'pointer',
                      background: selectedDataset?.id === ds.id ? 'rgba(29, 99, 237, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                      {ds.name}
                    </td>
                    <td>
                      <span className="badge-arch badge-matched">{ds.latest_version}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {(ds.size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--navy-700)' }}>
                      {ds.owner}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--navy-muted)' }}>
                      sha256:{ds.checksum.slice(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dataset Detail & Lineage Inspector */}
        {selectedDataset && (
          <div className="arch-card">
            <div className="arch-card-header">
              <span className="arch-card-title">Dataset Lineage & Metadata</span>
              <span className="badge-arch">{selectedDataset.latest_version}</span>
            </div>
            <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 className="h3-editorial" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                  {selectedDataset.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--navy-600)', lineHeight: 1.5 }}>
                  {selectedDataset.description || 'Raw binary experimental detector feeds from ATLAS detector.'}
                </p>
              </div>

              <div style={{ height: '1px', background: 'var(--border-hairline)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div>
                  <span style={{ color: 'var(--navy-muted)' }}>CURATOR: </span>
                  <strong style={{ color: 'var(--navy-900)' }}>{selectedDataset.owner}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--navy-muted)' }}>SHA-256 HASH: </span>
                  <span style={{ color: 'var(--electric-blue)', wordBreak: 'break-all' }}>{selectedDataset.checksum}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--navy-muted)' }}>STORAGE PATH: </span>
                  <span>/data/raw/collisions_2026.bin</span>
                </div>
                <div>
                  <span style={{ color: 'var(--navy-muted)' }}>FORMAT: </span>
                  <span>CERN ROOT / Binary Vector</span>
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-cream-alt)', border: 'var(--border-hairline)', borderRadius: '2px', fontSize: '11px' }}>
                <strong style={{ color: 'var(--navy-900)' }}>Lineage Graph: </strong>
                <span style={{ color: 'var(--navy-600)' }}>
                  Acquired at CERN LHC Point 1 → Pre-filtered by Level-1 Trigger → Published to REPROVIA Registry.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
