export type UIMode = 'spatial' | 'work';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'RESEARCHER' | 'DEVELOPER' | 'VIEWER';
  institution: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  org_id: string;
  description: string;
}

export interface WorkflowItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail extends WorkflowItem {
  project_id: string;
  raw_yaml: string;
  checksum: string;
  normalized_dag: any;
  is_valid: boolean;
}

export interface RunItem {
  id: string;
  run_number: number;
  workflow_name: string;
  workflow_version_id: string;
  status: 'QUEUED' | 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  triggered_by: string;
  reproduction_of_run_id: string | null;
  git_commit: string;
  kubernetes_namespace: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface RunStepDetail {
  id: string;
  name: string;
  status: 'QUEUED' | 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  pod_name: string | null;
  kubernetes_job_name: string | null;
  exit_code: number | null;
  cpu_usage: string | null;
  memory_usage: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface LogEntry {
  id?: string;
  step_name: string;
  stream: 'stdout' | 'stderr';
  timestamp: string;
  message: string;
}

export interface ArtifactItem {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  checksum: string;
  storage_path: string;
  preview_text?: string;
}

export interface RunDetail extends RunItem {
  workflow_id: string;
  workflow_version: number;
  parameters: Record<string, any>;
  environment_vars: Record<string, any>;
  error_message: string | null;
  steps: RunStepDetail[];
  logs: LogEntry[];
  artifacts: ArtifactItem[];
  provenance_fingerprint: string | null;
  normalized_dag: any;
}

export interface DatasetItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  tags: string[];
  versions_count: number;
  latest_version: string;
  checksum: string;
  size_bytes: number;
  created_at: string;
}

export interface ProvenanceNode {
  id: string;
  category: 'DATASET' | 'WORKFLOW' | 'CODE' | 'CONTAINERS' | 'KUBERNETES' | 'EXECUTION' | 'ARTIFACT';
  title: string;
  subtitle: string;
  status: string;
  metadata: Record<string, any>;
  spatial: { x: number; y: number; z: number };
}

export interface ProvenanceEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface ProvenanceGraphData {
  run_id: string;
  is_immutable: boolean;
  created_at: string;
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

export interface ComparisonItem {
  category: string;
  status: 'MATCHED' | 'DIFFERENT' | 'INCONCLUSIVE';
  original_value: string;
  reproduced_value: string;
  details: string;
}

export interface ReproductionReport {
  original_run_id: string;
  original_run_number: number;
  reproduced_run_id: string;
  reproduced_run_number: number;
  overall_verdict: 'MATCHED' | 'DIFFERENT' | 'INCONCLUSIVE';
  summary_verdict: string;
  comparison_matrix: ComparisonItem[];
  duration_difference_seconds: number | null;
}
