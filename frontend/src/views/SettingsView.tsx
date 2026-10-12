import React, { useState, useEffect } from 'react';
import { Settings, Shield, Server, HardDrive, Key, Save, CheckCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [execMode, setExecMode] = useState('mock');
  const [namespace, setNamespace] = useState('reprovia-workloads');
  const [storageProvider, setStorageProvider] = useState('local');
  const [strictProvenance, setStrictProvenance] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('reprovia_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.execMode) setExecMode(parsed.execMode);
        if (parsed.namespace) setNamespace(parsed.namespace);
        if (parsed.storageProvider) setStorageProvider(parsed.storageProvider);
        if (parsed.strictProvenance !== undefined) setStrictProvenance(parsed.strictProvenance);
      } catch {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('reprovia_settings', JSON.stringify({
      execMode,
      namespace,
      storageProvider,
      strictProvenance
    }));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            PLATFORM GOVERNANCE & EXECUTION CONFIGURATION
          </div>
          <h2 className="h2-editorial">Platform Settings</h2>
        </div>

        <button className="btn-reprovia-primary" onClick={handleSave}>
          <Save size={14} />
          <span>Save Configuration</span>
        </button>
      </div>

      {savedMsg && (
        <div style={{ padding: '12px 16px', background: 'var(--bg-cream-alt)', border: '1.5px solid var(--status-matched)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--navy-900)' }}>
          <CheckCircle size={15} color="var(--status-matched)" />
          <span>Platform governance preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {/* Execution Mode Settings */}
        <div className="arch-card">
          <div className="arch-card-header">
            <span className="arch-card-title">
              <Server size={14} />
              <span>Execution Engine Mode</span>
            </span>
            <span className="badge-arch badge-running">ACTIVE</span>
          </div>
          <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '6px' }}>
                CURRENT EXECUTION ADAPTER
              </label>
              <select
                value={execMode}
                onChange={(e) => setExecMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-cream-alt)',
                  border: '1px solid var(--navy-800)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              >
                <option value="mock">Local Mock Executor (Development Simulation)</option>
                <option value="kubernetes">Production Kubernetes Cluster (Batch/v1 Jobs)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '6px' }}>
                TARGET KUBERNETES NAMESPACE
              </label>
              <input
                type="text"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-cream-alt)',
                  border: '1px solid var(--navy-800)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--navy-600)' }}>
              When Kubernetes mode is selected, workflow steps are submitted via official Kubernetes client using in-cluster service account or kubeconfig.
            </div>
          </div>
        </div>

        {/* Artifact Storage Settings */}
        <div className="arch-card">
          <div className="arch-card-header">
            <span className="arch-card-title">
              <HardDrive size={14} />
              <span>Artifact Storage Backend</span>
            </span>
            <span className="badge-arch badge-matched">VERIFIED</span>
          </div>
          <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '6px' }}>
                STORAGE PROVIDER
              </label>
              <select
                value={storageProvider}
                onChange={(e) => setStorageProvider(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-cream-alt)',
                  border: '1px solid var(--navy-800)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              >
                <option value="local">Local Filesystem Storage (./artifacts_storage)</option>
                <option value="s3">CERN S3 / MinIO Object Storage</option>
                <option value="ceph">CephFS Persistent Volume Claim</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '6px' }}>
                DIGEST HASH ALGORITHM
              </label>
              <input
                type="text"
                disabled
                value="SHA-256 (FIPS 180-4 Compliant)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-cream-alt)',
                  border: 'var(--border-hairline)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--navy-muted)'
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
