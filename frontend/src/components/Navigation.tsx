import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu,
  X,
  LayoutDashboard, 
  GitFork, 
  PenTool, 
  PlayCircle, 
  Database, 
  Archive, 
  FileCode2, 
  Server, 
  Users, 
  Settings, 
  Layers, 
  Sliders,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu
} from 'lucide-react';
import { UIMode, UserProfile } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  uiMode: UIMode;
  setUiMode: (mode: UIMode) => void;
  user: UserProfile | null;
  projectName: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  uiMode,
  setUiMode,
  user,
  projectName
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Grouped Navigation Categories
  const navCategories = [
    {
      category: 'COMPUTATIONAL WORKFLOWS',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          desc: 'Operational telemetry, job health & cluster vitals',
          icon: LayoutDashboard
        },
        {
          id: 'workflows',
          label: 'Workflows',
          desc: 'Published reproducible DAG specifications & versions',
          icon: GitFork
        },
        {
          id: 'builder',
          label: 'Workflow Builder',
          desc: 'Synchronized Monaco YAML & interactive React Flow editor',
          icon: PenTool
        },
        {
          id: 'runs',
          label: 'Runs & Executions',
          desc: 'Container job tracking, live SSE logs & reproduction',
          icon: PlayCircle
        }
      ]
    },
    {
      category: 'SCIENTIFIC DATA & ARTIFACTS',
      items: [
        {
          id: 'datasets',
          label: 'Datasets Registry',
          desc: 'Immutable datasets, cryptographic checksums & lineage',
          icon: Database
        },
        {
          id: 'artifacts',
          label: 'Artifact Tree',
          desc: 'Output files, CSV matrices, SVG plots & reports',
          icon: Archive
        },
        {
          id: 'templates',
          label: 'Physics Templates',
          desc: 'Pre-configured CERN ATLAS, Monte Carlo & genomics DAGs',
          icon: FileCode2
        }
      ]
    },
    {
      category: 'INFRASTRUCTURE & GOVERNANCE',
      items: [
        {
          id: 'infrastructure',
          label: 'Kubernetes Cluster',
          desc: 'Node telemetry, CPU/RAM utilization & Helm deployments',
          icon: Server
        },
        {
          id: 'members',
          label: 'Members & RBAC',
          desc: 'Access control, researcher roles & permissions',
          icon: Users
        },
        {
          id: 'settings',
          label: 'Platform Settings',
          desc: 'Execution mode, storage backend & security policies',
          icon: Settings
        }
      ]
    }
  ];

  // Find active item info for the top bar
  const allItems = navCategories.flatMap((c) => c.items);
  const currentItem = allItems.find((i) => i.id === activeTab) || allItems[0];
  const CurrentIcon = currentItem.icon;

  // Close menu on click outside or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false); // Close container drawer after selection
  };

  return (
    <div ref={menuRef} style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Fixed Navigation Bar */}
      <header className="top-nav">
        {/* Brand & Project Context */}
        <div className="brand-section">
          <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => handleSelectTab('dashboard')}>
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <div>
              <span>REPROVIA</span>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
                REPRODUCIBLE SCIENCE INFRASTRUCTURE
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--navy-muted)', opacity: 0.3, margin: '0 4px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--navy-muted)' }}>PROJECT:</span>
            <span style={{ fontWeight: 600, color: 'var(--navy-900)', background: 'var(--bg-cream-alt)', padding: '2px 8px', border: 'var(--border-hairline)' }}>
              {projectName || 'Particle Resonance Investigation'}
            </span>
          </div>
        </div>

        {/* Center: Dedicated Horizontal Menu Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            className={`menu-toggle-trigger ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Click to expand or hide all workspace navigation containers"
          >
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
            <span>WORKSPACE MENU</span>
            <ChevronDown
              size={14}
              style={{
                transform: isMenuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {/* Current Workspace Breadcrumb */}
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--bg-cream)',
              border: 'var(--border-hairline)',
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px'
            }}
          >
            <span style={{ color: 'var(--navy-muted)' }}>AREA:</span>
            <CurrentIcon size={12} color="var(--electric-blue)" />
            <strong style={{ color: 'var(--navy-900)' }}>{currentItem.label}</strong>
          </div>
        </div>

        {/* Right Controls: Mode Toggle & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Spatial vs Work Mode Toggle */}
          <div className="mode-toggle-group" title="Switch between 3D Spatial Architectural View and High-Density Operational Work Mode">
            <button
              className={`mode-toggle-btn ${uiMode === 'spatial' ? 'active' : ''}`}
              onClick={() => setUiMode('spatial')}
            >
              <Layers size={13} />
              <span>SPATIAL</span>
            </button>
            <button
              className={`mode-toggle-btn ${uiMode === 'work' ? 'active' : ''}`}
              onClick={() => setUiMode('work')}
            >
              <Sliders size={13} />
              <span>WORK</span>
            </button>
          </div>

          {/* User Identity Stamp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-cream-card)',
              border: 'var(--border-hairline)',
              boxShadow: 'var(--shadow-architectural-sm)',
              borderRadius: '2px'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                background: 'var(--navy-800)',
                color: 'var(--bg-cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)'
              }}
            >
              HV
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                {user?.name || 'Dr. H. Vance'}
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>
                CERN EP-SFT • OWNER
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Expandable Horizontal Navigation Containers (Drawer) */}
      {isMenuOpen && (
        <div className="nav-drawer-container bg-technical-grid">
          <div className="nav-grid-categories">
            {navCategories.map((cat, catIdx) => (
              <div key={catIdx} className="nav-category-col">
                <div className="nav-category-header">
                  <span>{cat.category}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`nav-item-card ${isActive ? 'active' : ''}`}
                        onClick={() => handleSelectTab(item.id)}
                      >
                        <div className="nav-item-icon-box">
                          <ItemIcon size={16} />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="nav-item-title">{item.label}</span>
                            {isActive && (
                              <span className="badge-arch badge-running" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="nav-item-desc">{item.desc}</div>
                        </div>

                        <ArrowRight size={13} color="var(--navy-muted)" style={{ marginTop: '4px', opacity: 0.6 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Quick Controls Footer */}
          <div
            style={{
              maxWidth: '1440px',
              margin: '18px auto 0 auto',
              paddingTop: '12px',
              borderTop: 'var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--navy-muted)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-annotation" style={{ fontSize: '13px' }}>
                Tip: Press ESC or click the menu button to close
              </span>
            </div>

            <button
              onClick={() => setIsMenuOpen(false)}
              className="btn-reprovia-secondary"
              style={{ fontSize: '10px', padding: '3px 10px' }}
            >
              <span>Close Menu [✕]</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
