import {
  UserProfile,
  Organization,
  Project,
  WorkflowItem,
  WorkflowDetail,
  RunItem,
  RunDetail,
  DatasetItem,
  ProvenanceGraphData,
  ReproductionReport
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

export const api = {
  // Auth & RBAC
  async getCurrentUser(): Promise<{ user: UserProfile; organizations: Organization[]; projects: Project[]; active_project_id: string }> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to load user profile');
    return res.json();
  },

  async getRoles(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/roles`);
    return res.json();
  },

  // Workflows
  async listWorkflows(projectId?: string): Promise<WorkflowItem[]> {
    const url = projectId ? `${API_BASE}/workflows?project_id=${projectId}` : `${API_BASE}/workflows`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load workflows');
    return res.json();
  },

  async getWorkflow(id: string): Promise<WorkflowDetail> {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    if (!res.ok) throw new Error('Failed to load workflow details');
    return res.json();
  },

  async validateYaml(yamlContent: string): Promise<{ is_valid: boolean; errors: any[]; normalized_dag: any }> {
    const res = await fetch(`${API_BASE}/workflows/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml_content: yamlContent })
    });
    return res.json();
  },

  async createWorkflow(data: { project_id: string; name: string; description?: string; tags?: string[]; yaml_content: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail ? JSON.stringify(err.detail) : 'Failed to create workflow');
    }
    return res.json();
  },

  async publishVersion(workflowId: string, yamlContent: string): Promise<any> {
    const res = await fetch(`${API_BASE}/workflows/${workflowId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml_content: yamlContent })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail ? JSON.stringify(err.detail) : 'Failed to publish version');
    }
    return res.json();
  },

  // Runs
  async listRuns(workflowId?: string): Promise<RunItem[]> {
    const url = workflowId ? `${API_BASE}/runs?workflow_id=${workflowId}` : `${API_BASE}/runs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load runs');
    return res.json();
  },

  async getRunDetail(runId: string): Promise<RunDetail> {
    const res = await fetch(`${API_BASE}/runs/${runId}`);
    if (!res.ok) throw new Error('Failed to load run details');
    return res.json();
  },

  async triggerRun(data: { workflow_id: string; version_id?: string; parameters?: Record<string, any>; environment_vars?: Record<string, any> }): Promise<any> {
    const res = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to trigger run');
    }
    return res.json();
  },

  // Provenance & Reproduction
  async getProvenanceGraph(runId: string): Promise<ProvenanceGraphData> {
    const res = await fetch(`${API_BASE}/provenance/${runId}/graph`);
    if (!res.ok) throw new Error('Failed to load provenance graph');
    return res.json();
  },

  async triggerReproduction(runId: string): Promise<{ new_run_id: string; new_run_number: number; original_run_id: string; original_run_number: number }> {
    const res = await fetch(`${API_BASE}/reproduction/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id: runId })
    });
    if (!res.ok) throw new Error('Failed to trigger reproduction');
    return res.json();
  },

  async compareRuns(originalRunId: string, reproducedRunId: string): Promise<ReproductionReport> {
    const res = await fetch(`${API_BASE}/reproduction/compare?original_run_id=${originalRunId}&reproduced_run_id=${reproducedRunId}`);
    if (!res.ok) throw new Error('Failed to compare runs');
    return res.json();
  },

  // Datasets
  async listDatasets(projectId?: string): Promise<DatasetItem[]> {
    const url = projectId ? `${API_BASE}/datasets?project_id=${projectId}` : `${API_BASE}/datasets`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load datasets');
    return res.json();
  },

  // Artifacts
  async getArtifact(artifactId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/artifacts/${artifactId}`);
    if (!res.ok) throw new Error('Failed to load artifact');
    return res.json();
  },

  // Infrastructure & Helm
  async getInfrastructure(): Promise<any> {
    const res = await fetch(`${API_BASE}/infrastructure/overview`);
    if (!res.ok) throw new Error('Failed to load infrastructure telemetry');
    return res.json();
  },

  async getHelmStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/infrastructure/helm`);
    if (!res.ok) throw new Error('Failed to load Helm release status');
    return res.json();
  }
};
