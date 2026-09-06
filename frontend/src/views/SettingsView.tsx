import React from 'react';
import { Settings, Shield, Server, HardDrive, Key, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
          PLATFORM GOVERNANCE & EXECUTION CONFIGURATION
        </div>
        <h2 className="h2-editorial">Platform Settings</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
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
                defaultValue="mock"
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
                defaultValue="reprovia-workloads"
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
                defaultValue="local"
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
      </div>
    </div>
  );
};
