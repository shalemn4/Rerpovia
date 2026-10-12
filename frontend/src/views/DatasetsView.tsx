import React, { useEffect, useState, useRef } from 'react';
import { Database, Upload, FileText, CheckCircle, ShieldCheck, Tag, User, Download, X, Plus } from 'lucide-react';
import { api } from '../api/client';
import { DatasetItem } from '../types';

export const DatasetsView: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Upload form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [versionTag, setVersionTag] = useState('v1.0');
  const [owner, setOwner] = useState('Dr. H. Vance (CERN)');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatasets = async () => {
    try {
      const data = await api.listDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDataset) {
        setSelectedDataset(data[0]);
      } else if (selectedDataset) {
        const found = data.find((d) => d.id === selectedDataset.id);
        if (found) setSelectedDataset(found);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Dataset name is required.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', name);
        formData.append('description', description);
        formData.append('version_tag', versionTag);
        formData.append('owner', owner);
        formData.append('tags', JSON.stringify(['cern', 'open-data', versionTag]));

        const res = await api.uploadDataset(formData);
        setIsModalOpen(false);
        resetForm();
        await loadDatasets();
        const found = datasets.find((d) => d.id === res.id);
        if (found) setSelectedDataset(found);
      } else {
        // Create registered dataset record
        const res = await api.createDataset({
          name,
          description,
          version_tag: versionTag,
          owner,
          tags: ['cern', 'open-data', versionTag],
          file_format: 'binary/dataset'
        });
        setIsModalOpen(false);
        resetForm();
        await loadDatasets();
        const found = datasets.find((d) => d.id === res.id);
        if (found) setSelectedDataset(found);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setVersionTag('v1.0');
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            IMMUTABLE RESEARCH DATASETS & VERSIONING
          </div>
          <h2 className="h2-editorial">Dataset Registry</h2>
        </div>

        <button className="btn-reprovia-primary" onClick={() => setIsModalOpen(true)}>
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
                      {(ds.size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--navy-700)' }}>
                      {ds.owner}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--navy-muted)' }}>
                      sha256:{ds.checksum ? ds.checksum.slice(0, 10) : 'none'}...
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
            <div className="arch-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="arch-card-title">Dataset Lineage & Metadata</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge-arch">{selectedDataset.latest_version}</span>
                <a
                  href={api.getDatasetDownloadUrl(selectedDataset.id)}
                  download={`${selectedDataset.slug}.bin`}
                  className="btn-reprovia-secondary"
                  style={{ fontSize: '11px', padding: '3px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={12} />
                  <span>Download</span>
                </a>
              </div>
            </div>
            <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 className="h3-editorial" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                  {selectedDataset.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--navy-600)', lineHeight: 1.5 }}>
                  {selectedDataset.description || 'Raw scientific experimental feed.'}
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
                  <span style={{ color: 'var(--navy-muted)' }}>DATASET ID: </span>
                  <span>{selectedDataset.id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--navy-muted)' }}>VERSIONS REGISTERED: </span>
                  <span>{selectedDataset.versions_count || 1}</span>
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-cream-alt)', border: 'var(--border-hairline)', borderRadius: '2px', fontSize: '11px' }}>
                <strong style={{ color: 'var(--navy-900)' }}>Lineage Graph: </strong>
                <span style={{ color: 'var(--navy-600)' }}>
                  Acquired at CERN LHC Point 1 → Pre-filtered by Trigger → Cryptographically locked in REPROVIA Registry.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
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
              width: '560px',
              maxWidth: '95vw',
              background: '#ffffff',
              boxShadow: '12px 12px 0px rgba(12, 25, 44, 0.95)'
            }}
          >
            <div className="arch-card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} color="var(--electric-blue)" />
                <span className="arch-card-title">Register & Upload Dataset Version</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorMsg && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', borderRadius: '2px' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                  DATASET NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ATLAS Collision Run-4 Stream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-body)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                    VERSION TAG
                  </label>
                  <input
                    type="text"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="v1.0"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                    CURATOR / RESEARCHER
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-body)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scientific context, acquisition parameters, detector calibrations..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-body)', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                  DATASET FILE (AUTOMATIC SHA-256 CHECKSUMMING)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: '100%', padding: '6px', border: '1px solid var(--navy-800)', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-reprovia-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-reprovia-primary" disabled={uploading}>
                  {uploading ? 'Calculating Hash & Uploading...' : 'Register Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
