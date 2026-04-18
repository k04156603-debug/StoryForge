import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch } from 'lucide-react';

const priorityColors = {
  critical: '#f87171',
  high: '#fbbf24',
  medium: '#818cf8',
  low: '#4ade80',
};

const edgeTypeColors = {
  blocks: '#f87171',
  depends_on: '#818cf8',
  related_to: '#64748b',
};

function CustomNode({ data }) {
  return (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-primary-400 bg-primary-600/20 px-1.5 py-0.5 rounded">
          {data.storyId}
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: priorityColors[data.priority] || '#818cf8' }}
        />
      </div>
      <p className="text-xs font-medium text-white leading-tight">{data.label}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] text-surface-400">{data.featureName}</span>
        <span className="text-[10px] text-surface-500">•</span>
        <span className="text-[10px] text-primary-300">{data.storyPoints} pts</span>
      </div>
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

export default function DependencyGraphView({ graph }) {
  const initialNodes = useMemo(() => {
    if (!graph?.nodes) return [];
    return graph.nodes.map((n) => ({
      id: n.id,
      type: 'custom',
      position: n.position || { x: Math.random() * 800, y: Math.random() * 600 },
      data: {
        label: n.label,
        storyId: n.id,
        featureName: n.featureName,
        storyPoints: n.storyPoints,
        priority: n.priority,
      },
    }));
  }, [graph]);

  const initialEdges = useMemo(() => {
    if (!graph?.edges) return [];
    return graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      animated: e.type === 'blocks',
      style: {
        stroke: edgeTypeColors[e.type] || '#818cf8',
        strokeWidth: e.type === 'blocks' ? 2.5 : 1.5,
      },
      labelStyle: { fill: '#94a3b8', fontSize: 10 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
    }));
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (!graph || (graph.nodes?.length === 0 && graph.edges?.length === 0)) {
    return (
      <div className="glass-card p-8 text-center">
        <GitBranch size={32} className="mx-auto text-surface-500 mb-3" />
        <p className="text-surface-400">No dependency data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-surface-400">
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-danger-400" style={{ display: 'inline-block' }} />
          Blocks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-primary-400" style={{ display: 'inline-block' }} />
          Depends on
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-surface-600" style={{ display: 'inline-block' }} />
          Related to
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger-400" /> Critical</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning-400" /> High</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-400" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success-400" /> Low</span>
      </div>

      {/* Graph */}
      <div className="glass-card overflow-hidden" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls
            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: '#1e293b' }}
          />
          <MiniMap
            nodeColor="#4f46e5"
            maskColor="rgba(15, 23, 42, 0.85)"
            style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: '#0f172a' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
