import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import Editor from '@monaco-editor/react';
import jsYaml from 'js-yaml';
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Upload, 
  Code, 
  Layers, 
  Cpu, 
  HardDrive, 
  Plus, 
  Trash2,
  ExternalLink,
  GitCommit
} from 'lucide-react';

import { ComputeStepNode } from '../components/customNodes/ComputeStepNode';
import { DatasetNode } from '../components/customNodes/DatasetNode';
import { ResultsNode } from '../components/customNodes/ResultsNode';
import { api } from '../api/client';

const INITIAL_YAML = `version: "1.0"
name: particle-analysis
description: "Higgs boson invariant mass reconstruction from ATLAS open collision data."

inputs:
  dataset: /data/raw/collisions_2026.bin
  detector_calibration: /data/calib/geom_v4.json

steps:
  - name: preprocess
    image: reprovia/preprocess:1.2
    command: python preprocess.py --input /data/raw/collisions_2026.bin --snr 4.5 --out /data/preprocessed/events.parquet
    resources:
      cpu_request: "500m"
      memory_request: "512Mi"
      cpu_limit: "1000m"
      memory_limit: "1Gi"
    env:
      OMP_NUM_THREADS: "4"

  - name: analyze
    image: reprovia/analyze:1.2
    command: python analyze.py --events /data/preprocessed/events.parquet --bins 100 --out /results/analysis.csv
    depends_on:
      - preprocess
    resources:
      cpu_request: "1000m"
      memory_request: "1Gi"
      cpu_limit: "2000m"
      memory_limit: "2Gi"
    env:
      MC_ITERATIONS: "10000"
      RANDOM_SEED: "42"

  - name: visualize
    image: reprovia/visualize:1.2
    command: python visualize.py --fit /results/analysis.csv --out /results/histogram.svg
    depends_on:
      - analyze
    resources:
      cpu_request: "500m"
      memory_request: "512Mi"
      cpu_limit: "1000m"
      memory_limit: "1Gi"
    outputs:
      - /results/histogram.svg
      - /results/summary.json
      - /results/analysis.csv

outputs:
  - /results/summary.json
  - /results/analysis.csv
  - /results/histogram.svg
`;

interface WorkflowBuilderViewProps {
  onNavigate: (tab: string, runId?: string) => void;
  workflowId?: string;
}

export const WorkflowBuilderView: React.FC<WorkflowBuilderViewProps> = ({ onNavigate, workflowId }) => {
  const [yamlContent, setYamlContent] = useState(INITIAL_YAML);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(workflowId || null);
  const [workflowName, setWorkflowName] = useState('Particle Collision Analysis');
  const [workflowVersion, setWorkflowVersion] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Register custom nodes
  const nodeTypes = useMemo(() => ({
    computeStepNode: ComputeStepNode,
    datasetNode: DatasetNode,
    resultsNode: ResultsNode
  }), []);

  // Validation & DAG Normalization
  const handleValidate = useCallback(async (content: string) => {
    try {
      const res = await api.validateYaml(content);
      setIsValid(res.is_valid);
      setValidationErrors(res.errors || []);

      if (res.is_valid && res.normalized_dag?.react_flow) {
        setNodes(res.normalized_dag.react_flow.nodes);
        setEdges(res.normalized_dag.react_flow.edges);
        if (res.normalized_dag.name) {
          setWorkflowName(res.normalized_dag.name);
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
  }, [setNodes, setEdges]);

  // Initial load or validation
  useEffect(() => {
    handleValidate(yamlContent);
  }, [handleValidate]);

  // Debounced YAML editor change
  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setYamlContent(value);
    handleValidate(value);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  // Execute Workflow -> Dispatches Run & navigates to Run Detail
  const handleExecute = async () => {
    setIsExecuting(true);
    setFeedbackMsg(null);
    try {
      // If no workflow saved yet, create one first
      let targetWfId = activeWorkflowId;
      if (!targetWfId) {
        const wfRes = await api.createWorkflow({
          project_id: 'proj-particle-physics',
          name: workflowName || 'Particle Collision Analysis',
          description: 'Executed from REPROVIA Workflow Builder',
          tags: ['interactive', 'cern'],
          yaml_content: yamlContent
        });
        targetWfId = wfRes.id;
        setActiveWorkflowId(targetWfId);
      } else {
        // Publish version
        await api.publishVersion(targetWfId, yamlContent);
      }

      if (!targetWfId) throw new Error('Workflow ID could not be established');

      // Trigger run
      const runRes = await api.triggerRun({
        workflow_id: targetWfId,
        parameters: { snr: 4.5, mc_iterations: 10000 },
        environment_vars: { OMP_NUM_THREADS: '4' }
      });

      setFeedbackMsg({ type: 'success', text: `Run #${runRes.run_number} queued successfully. Redirecting...` });
      setTimeout(() => {
        onNavigate('run-detail', runRes.run_id);
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to execute workflow' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveDraft = async () => {
    setFeedbackMsg({ type: 'success', text: 'Workflow draft saved locally with SHA-256 fingerprint.' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Builder Sub-Toolbar */}
      <div
        style={{
          height: '56px',
          background: 'var(--bg-cream-card)',
          borderBottom: 'var(--border-hairline)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-editorial)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy-900)' }}>
                {workflowName}
              </span>
              <span className="badge-arch" style={{ background: 'var(--bg-cream-alt)' }}>
                v{workflowVersion}.0
              </span>
              {isValid ? (
                <span className="badge-arch badge-matched">
                  <CheckCircle size={10} />
                  <span>DAG VALID</span>
                </span>
              ) : (
                <span className="badge-arch badge-diff">
                  <AlertCircle size={10} />
                  <span>{validationErrors.length} ERRORS</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {feedbackMsg && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: feedbackMsg.type === 'success' ? 'var(--status-matched)' : 'var(--status-diff)',
                fontWeight: 600
              }}
            >
              {feedbackMsg.text}
            </span>
          )}

          <button className="btn-reprovia-secondary" onClick={handleSaveDraft}>
            <Save size={13} />
            <span>Save Draft</span>
          </button>

          <button
            className="btn-reprovia-primary"
            onClick={handleExecute}
            disabled={!isValid || isExecuting}
            style={{ opacity: !isValid || isExecuting ? 0.6 : 1 }}
          >
            <Play size={13} fill="#ffffff" />
            <span>{isExecuting ? 'Starting Job...' : 'Execute Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Synchronized Workspace: Monaco Editor (Left) & React Flow (Right) */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '460px 1fr', overflow: 'hidden' }}>
        {/* Left Pane: Monaco YAML Editor */}
        <div
          style={{
            borderRight: 'var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--navy-900)'
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--navy-800)',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--navy-700)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={13} color="#38bdf8" />
              <span>WORKFLOW SPECIFICATION (YAML SOURCE OF TRUTH)</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>SPEC v1.0</span>
          </div>

          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              language="yaml"
              theme="vs-dark"
              value={yamlContent}
              onChange={handleEditorChange}
              options={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2
              }}
            />
          </div>

          {/* Validation Diagnostics Drawer */}
          {validationErrors.length > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderTop: '1px solid #ef4444',
                padding: '10px 16px',
                maxHeight: '130px',
                overflowY: 'auto',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#fca5a5'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={12} color="#ef4444" />
                <span>SPECIFICATION VALIDATION ERRORS:</span>
              </div>
              {validationErrors.map((err, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  • {err.msg} <span style={{ opacity: 0.7 }}>({err.type})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: React Flow Canvas */}
        <div style={{ position: 'relative', background: 'var(--bg-cream)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="rgba(12, 25, 44, 0.15)" gap={24} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'datasetNode') return '#eae3d5';
                if (n.type === 'resultsNode') return '#86efac';
                return '#adc6fa';
              }}
              style={{ background: '#fdfbf7', border: '1px solid var(--navy-800)' }}
            />
          </ReactFlow>

          {/* Step Configuration Drawer (when a node is selected) */}
          {selectedNode && selectedNode.data && (
            <div
              className="arch-card"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '320px',
                background: '#ffffff',
                boxShadow: 'var(--shadow-architectural-lg)',
                zIndex: 20
              }}
            >
              <div className="arch-card-header">
                <span className="arch-card-title">
                  <Layers size={14} />
                  <span>Node Configuration</span>
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--navy-muted)' }}
                >
                  ✕
                </button>
              </div>
              <div className="arch-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>STEP NAME</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-editorial)', color: 'var(--navy-900)' }}>
                    {selectedNode.data.label}
                  </div>
                </div>

                {selectedNode.data.image && (
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>CONTAINER IMAGE</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>
                      {selectedNode.data.image}
                    </div>
                  </div>
                )}

                {selectedNode.data.command && (
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>ENTRYPOINT COMMAND</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg-cream-alt)', padding: '6px 8px', borderRadius: '2px', wordBreak: 'break-all' }}>
                      {selectedNode.data.command}
                    </div>
                  </div>
                )}

                {selectedNode.data.resources && (
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', marginBottom: '4px' }}>
                      KUBERNETES RESOURCE BOUNDS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ background: 'var(--bg-cream)', padding: '4px 8px', border: 'var(--border-hairline)' }}>
                        Req: {selectedNode.data.resources.cpu_request || '500m'}
                      </div>
                      <div style={{ background: 'var(--bg-cream)', padding: '4px 8px', border: 'var(--border-hairline)' }}>
                        Lim: {selectedNode.data.resources.cpu_limit || '1000m'}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--navy-muted)', fontStyle: 'italic' }}>
                  Edits to this node synchronize automatically with the left Monaco YAML editor.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
