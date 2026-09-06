import React from 'react';
import { FileCode2, ArrowRight, Layers, Cpu, Database } from 'lucide-react';

interface TemplatesViewProps {
  onNavigate: (tab: string, runId?: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onNavigate }) => {
  const templates = [
    {
      title: 'Particle Collision Analysis',
      category: 'High Energy Physics',
      description: 'Calibrated ATLAS LHC invariant mass reconstruction with Monte Carlo Breit-Wigner resonance fitting.',
      steps: ['preprocess', 'analyze', 'visualize'],
      tags: ['CERN', 'Physics', 'ROOT', 'Higgs'],
      yaml: 'reprovia-particle-analysis'
    },
    {
      title: 'Monte Carlo Quantum Simulation',
      category: 'Quantum Computing & Field Theory',
      description: 'Lattice quantum field simulation measuring 4D correlation functions with GPU acceleration.',
      steps: ['lattice_init', 'thermalize', 'sample_observables'],
      tags: ['Quantum', 'Simulation', 'Lattice', 'GPU'],
      yaml: 'reprovia-monte-carlo'
    },
    {
      title: 'Deep Learning Genomic Variant Classifier',
      category: 'Computational Biology',
      description: 'Functional scoring of non-coding regulatory genomic variants using deep residual neural networks.',
      steps: ['vcf_qc', 'deep_score', 'aggregate'],
      tags: ['Bioinformatics', 'Genomics', 'Deep Learning'],
      yaml: 'reprovia-genomics'
    },
    {
      title: 'Astronomical Image Deconvolution',
      category: 'Astrophysics',
      description: 'Multi-wavelength interferometry optical transfer function restoration for telescope arrays.',
      steps: ['load_fits', 'richardson_lucy', 'export_skymap'],
      tags: ['Astronomy', 'Images', 'FFT'],
      yaml: 'reprovia-astro'
    }
  ];

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
          VERIFIED COMPUTATIONAL WORKFLOW ARCHETYPES
        </div>
        <h2 className="h2-editorial">Scientific Workflow Templates</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {templates.map((tpl, idx) => (
          <div key={idx} className="arch-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="arch-card-header">
                <span className="arch-card-title">{tpl.title}</span>
                <span className="badge-arch badge-matched">{tpl.category}</span>
              </div>

              <div className="arch-card-body">
                <p style={{ fontSize: '12px', color: 'var(--navy-600)', marginBottom: '16px', lineHeight: 1.5 }}>
                  {tpl.description}
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginBottom: '6px' }}>
                    EXECUTION DAG STEPS:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {tpl.steps.map((s, i) => (
                      <React.Fragment key={s}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-cream-alt)', padding: '2px 8px', border: 'var(--border-hairline)', borderRadius: '1px' }}>
                          {s}
                        </span>
                        {i < tpl.steps.length - 1 && <span style={{ color: 'var(--navy-muted)' }}>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tpl.tags.map((tg) => (
                    <span key={tg} className="badge-arch" style={{ background: '#fff', fontSize: '10px' }}>
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 18px', borderTop: 'var(--border-hairline)', background: 'var(--bg-cream-alt)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-reprovia-primary"
                style={{ fontSize: '11px', padding: '6px 14px' }}
                onClick={() => onNavigate('builder')}
              >
                <span>Use Template</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
