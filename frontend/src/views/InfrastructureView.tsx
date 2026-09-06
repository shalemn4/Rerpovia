import React, { useEffect, useState } from 'react';
import { Server, Cpu, HardDrive, ShieldCheck, Box, Terminal, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export const InfrastructureView: React.FC = () => {
  const [infra, setInfra] = useState<any>(null);
  const [helm, setHelm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [infraData, helmData] = await Promise.all([
          api.getInfrastructure(),
          api.getHelmStatus()
        ]);
        setInfra(infraData);
        setHelm(helmData);
      } catch (err) {
        console.error('Failed to load infra data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            KUBERNETES TOPOLOGY & CLUSTER TELEMETRY
          </div>
          <h2 className="h2-editorial">Computational Infrastructure</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-arch badge-matched">K8S v1.29.2</span>
          <span className="badge-arch badge-running">CILIUM eBPF</span>
          <span className="badge-arch" style={{ background: 'var(--bg-cream-alt)' }}>CEPH-CSI</span>
        </div>
      </div>

      {/* Cluster Overview Banner */}
      <div className="arch-card" style={{ padding: '20px 24px', background: 'var(--bg-cream-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>CONNECTED CLUSTER</div>
            <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-editorial)', fontWeight: 700, color: 'var(--navy-900)' }}>
              {infra?.cluster_name || 'reprovia-cern-hpc-01'}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>
              API SERVER: {infra?.api_server || 'https://k8s.cern.ch:6443'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>EXECUTION MODE</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)' }}>
                {infra?.execution_mode?.toUpperCase() || 'MOCK'} ADAPTER
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>TOTAL CORES</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)' }}>
                {infra?.total_cluster_cpu_cores || 112} vCPU
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>CLUSTER HEALTH</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-matched)' }}>
                ● 100% OPERATIONAL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Nodes Visual Cards */}
      <div>
        <h3 className="h3-editorial" style={{ marginBottom: '14px' }}>
          Worker Node Topology & Resource Saturation
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {infra?.nodes?.map((node: any) => (
            <div key={node.name} className="arch-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="arch-card-header">
                <span className="arch-card-title">
                  <Server size={14} />
                  <span>{node.name}</span>
                </span>
                <span className="badge-arch badge-matched">{node.status}</span>
              </div>
              <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                  ROLE: {node.role} • {node.zone}
                  {node.accelerator && <div style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>GPU: {node.accelerator}</div>}
                </div>

                {/* CPU Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    <span>CPU ALLOCATION ({node.cpu_cores} Cores)</span>
                    <strong>{node.cpu_usage_pct}%</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-cream-alt)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ width: `${node.cpu_usage_pct}%`, height: '100%', background: 'var(--navy-800)' }} />
                  </div>
                </div>

                {/* RAM Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    <span>MEMORY ALLOCATION ({node.memory_total_gb} GB)</span>
                    <strong>{node.memory_usage_pct}%</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-cream-alt)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ width: `${node.memory_usage_pct}%`, height: '100%', background: 'var(--electric-blue)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', borderTop: 'var(--border-hairline)', paddingTop: '8px' }}>
                  <span>RUNNING PODS: {node.running_pods_count} / {node.pod_capacity}</span>
                  <span>K3S {node.version}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production-Oriented Helm Release Management Section */}
      <div className="arch-card">
        <div className="arch-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={16} color="var(--navy-800)" />
            <span className="arch-card-title">Production-Oriented Helm Release (helm/reprovia)</span>
          </div>
          <span className="badge-arch badge-matched">STATUS: {helm?.status || 'DEPLOYED'}</span>
        </div>

        <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: 'var(--navy-muted)' }}>RELEASE: </span>
              <strong>{helm?.release_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--navy-muted)' }}>CHART: </span>
              <strong>{helm?.chart}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--navy-muted)' }}>NAMESPACE: </span>
              <strong>{helm?.namespace}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--navy-muted)' }}>REVISION: </span>
              <strong>#{helm?.revision}</strong>
            </div>
          </div>

          <div style={{ background: 'var(--navy-900)', color: '#e2e8f0', padding: '14px 18px', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <div style={{ color: '#94a3b8', marginBottom: '6px' }}># Production Deployment Command</div>
            <div style={{ color: '#38bdf8' }}>helm upgrade --install reprovia ./helm/reprovia --namespace reprovia-system --create-namespace</div>
          </div>

          {/* Helm Managed Components */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginBottom: '8px' }}>
              DEPLOYED COMPONENT TOPOLOGY:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {helm?.components?.map((c: any) => (
                <div key={c.name} style={{ padding: '10px 12px', background: 'var(--bg-cream-alt)', border: 'var(--border-hairline)', borderRadius: '2px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--navy-900)' }}>{c.name}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginTop: '2px' }}>
                    {c.kind} • Replicas: {c.replicas}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
