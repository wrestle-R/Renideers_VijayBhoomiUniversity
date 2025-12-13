import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from "@/components/ui/card";

// Custom Node Component
const ItineraryNode = ({ data }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-card border-2 border-primary/20 min-w-[200px] text-center relative group hover:border-primary transition-colors">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <div className="font-bold text-primary mb-1 text-sm">Day {data.day}</div>
      <div className="text-sm text-card-foreground font-medium">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  );
};

const nodeTypes = {
  itinerary: ItineraryNode,
};

export function ItineraryFlow({ itinerary }) {
  // Transform itinerary array into nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!itinerary || itinerary.length === 0) return { nodes: [], edges: [] };

    const nodes = itinerary.map((item, index) => ({
      id: `day-${index + 1}`,
      type: 'itinerary',
      position: { x: 250, y: index * 150 + 50 }, // Vertical layout
      data: { day: index + 1, label: item },
    }));

    const edges = itinerary.slice(0, -1).map((_, index) => ({
      id: `e${index}-${index + 1}`,
      source: `day-${index + 1}`,
      target: `day-${index + 2}`,
      animated: true,
      style: { stroke: 'var(--primary)', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--primary)',
      },
    }));

    return { nodes, edges };
  }, [itinerary]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[600px] w-full border rounded-xl overflow-hidden bg-secondary/10 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="var(--muted-foreground)" gap={20} size={1} style={{ opacity: 0.2 }} />
        <Controls className="!bg-card !border-border !text-foreground [&>button]:!border-border [&>button:hover]:!bg-muted" />
      </ReactFlow>
    </div>
  );
}
