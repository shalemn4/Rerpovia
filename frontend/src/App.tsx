import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { SpatialHero } from './components/SpatialHero';
import { DashboardView } from './views/DashboardView';
import { WorkflowsView } from './views/WorkflowsView';
import { WorkflowBuilderView } from './views/WorkflowBuilderView';
import { RunsView } from './views/RunsView';
import { RunDetailView } from './views/RunDetailView';
import { DatasetsView } from './views/DatasetsView';
import { ArtifactsView } from './views/ArtifactsView';
import { TemplatesView } from './views/TemplatesView';
import { InfrastructureView } from './views/InfrastructureView';
import { MembersView } from './views/MembersView';
import { SettingsView } from './views/SettingsView';
import { UIMode, UserProfile } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeRunId, setActiveRunId] = useState<string>('run-184-cern-baseline');
  const [uiMode, setUiMode] = useState<UIMode>('spatial');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projectName, setProjectName] = useState<string>('Particle Resonance Investigation');

  useEffect(() => {
    async function initUser() {
      try {
        const authData = await api.getCurrentUser();
        setUser(authData.user);
        if (authData.projects && authData.projects.length > 0) {
          setProjectName(authData.projects[0].name);
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      }
    }
    initUser();
  }, []);

  const handleNavigate = (tab: string, runId?: string) => {
    if (runId) {
      setActiveRunId(runId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`reprovia-app ${uiMode === 'spatial' ? 'spatial-mode' : 'work-mode'}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Fixed Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        uiMode={uiMode}
        setUiMode={setUiMode}
        user={user}
        projectName={projectName}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Spatial Hero Section (Displayed on Dashboard in Spatial Mode) */}
        {activeTab === 'dashboard' && uiMode === 'spatial' && (
          <SpatialHero onNavigate={handleNavigate} />
        )}

        {/* View Routing */}
        {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {activeTab === 'workflows' && <WorkflowsView onNavigate={handleNavigate} />}
        {activeTab === 'builder' && <WorkflowBuilderView onNavigate={handleNavigate} />}
        {activeTab === 'runs' && <RunsView onNavigate={handleNavigate} />}
        {activeTab === 'run-detail' && <RunDetailView runId={activeRunId} onNavigate={handleNavigate} />}
        {activeTab === 'datasets' && <DatasetsView />}
        {activeTab === 'artifacts' && <ArtifactsView />}
        {activeTab === 'templates' && <TemplatesView onNavigate={handleNavigate} />}
        {activeTab === 'infrastructure' && <InfrastructureView />}
        {activeTab === 'members' && <MembersView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Scientific Institution Footer */}
      <footer
        style={{
          background: 'var(--bg-cream-alt)',
          borderTop: 'var(--border-hairline)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--navy-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ color: 'var(--navy-900)' }}>REPROVIA</strong>
          <span>•</span>
          <span>REPRODUCIBLE COMPUTATIONAL RESEARCH PLATFORM</span>
          <span>•</span>
          <span className="font-annotation" style={{ fontSize: '13px' }}>
            Built for High Energy Physics & Scientific Rigor
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <span>MODE: {uiMode.toUpperCase()}</span>
          <span>RELEASE: v1.0.0</span>
          <span>CERN OPEN SCIENCE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
