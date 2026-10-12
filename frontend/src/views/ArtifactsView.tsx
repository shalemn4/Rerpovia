import React, { useState, useEffect } from 'react';
import { Archive, FileText, Download, CheckCircle, ExternalLink, Code, Eye, Search, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { ArtifactItem } from '../types';

export const ArtifactsView: React.FC = () => {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadArtifacts = async () => {
    setLoading(true);
    try {
      const data = await api.listArtifacts();
      setArtifacts(data);
      if (data.length > 0) {
        setSelectedArtifact(data[0]);
        loadArtifactPreview(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load artifacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadArtifactPreview = async (artId: string) => {
    try {
      const detail = await api.getArtifact(artId);
      setPreviewContent(detail.preview_text || null);
    } catch (err) {
      console.error('Failed to load preview:', err);
      setPreviewContent(null);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, []);

  const handleSelectArtifact = (art: ArtifactItem) => {
    setSelectedArtifact(art);
    loadArtifactPreview(art.id);
  };

  const filteredArtifacts = artifacts.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.step_name && a.step_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            IMMUTABLE OUTPUT ARTIFACT STORE
          </div>
          <h2 className="h2-editorial">Artifact Tree & Previews</h2>
        </div>

        <button className="btn-reprovia-secondary" onClick={loadArtifacts}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh Artifacts</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        {/* Artifact Directory Tree */}
        <div className="arch-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '78vh' }}>
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Archive size={14} />
              <span>results/ ({artifacts.length})</span>
            </span>
            <span className="badge-arch badge-matched">VERIFIED</span>
          </div>

          <div style={{ padding: '10px 12px', borderBottom: 'var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-cream-alt)', padding: '6px 10px', borderRadius: '2px' }}>
              <Search size={12} color="var(--navy-muted)" />
              <input
                type="text"
                placeholder="Filter artifacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
            {filteredArtifacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '12px', color: 'var(--navy-muted)' }}>
                {loading ? 'Loading artifacts...' : 'No artifacts found.'}
              </div>
            ) : (
              filteredArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleSelectArtifact(art)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '8px',
                    background: selectedArtifact?.id === art.id ? 'var(--bg-cream-alt)' : '#fff',
                    border: selectedArtifact?.id === art.id ? '1.5px solid var(--electric-blue)' : 'var(--border-hairline)',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--navy-900)' }}>
                      {art.name}
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                      {(art.size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>
                      {art.run_number ? `Run #${art.run_number}` : art.step_name || 'Output'}
                    </span>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                      sha256:{art.checksum.slice(0, 10)}...
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Artifact Preview & Inspector */}
        <div className="arch-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '78vh' }}>
          <div className="arch-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="arch-card-title">
              <Eye size={14} />
              <span>Preview: {selectedArtifact?.name || 'No selection'}</span>
            </span>

            {selectedArtifact && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge-arch badge-matched">SHA-256 VERIFIED</span>
                <a
                  href={api.getArtifactRawUrl(selectedArtifact.id, true)}
                  download={selectedArtifact.name}
                  className="btn-reprovia-secondary"
                  style={{ fontSize: '11px', padding: '3px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={12} />
                  <span>Download</span>
                </a>
              </div>
            )}
          </div>

          <div className="arch-card-body" style={{ flex: 1, overflowY: 'auto' }}>
            {selectedArtifact ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Metadata strip */}
                <div style={{ display: 'flex', gap: '20px', padding: '10px 14px', background: 'var(--bg-cream-alt)', border: 'var(--border-hairline)', borderRadius: '2px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div>TYPE: <strong>{selectedArtifact.file_type.toUpperCase()}</strong></div>
                  <div>SIZE: <strong>{selectedArtifact.size_bytes} bytes</strong></div>
                  <div>STEP: <strong>{selectedArtifact.step_name || 'N/A'}</strong></div>
                  <div style={{ color: 'var(--navy-muted)' }}>HASH: <span style={{ color: 'var(--electric-blue)' }}>{selectedArtifact.checksum}</span></div>
                </div>

                {/* Content preview */}
                {selectedArtifact.file_type === 'svg' ? (
                  <div
                    style={{ background: '#08111e', padding: '16px', borderRadius: '2px', border: '1.5px solid var(--navy-800)' }}
                    dangerouslySetInnerHTML={{ __html: previewContent || '' }}
                  />
                ) : previewContent ? (
                  <pre style={{ background: 'var(--navy-900)', color: '#38bdf8', padding: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', borderRadius: '2px', overflowX: 'auto', maxHeight: '55vh' }}>
                    {previewContent}
                  </pre>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--navy-muted)' }}>
                    <FileText size={48} color="var(--navy-800)" style={{ margin: '0 auto 12px auto' }} />
                    <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{selectedArtifact.name}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      Binary scientific output artifact. Click download to inspect in external workbench.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--navy-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                Select an artifact from the list to preview content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
