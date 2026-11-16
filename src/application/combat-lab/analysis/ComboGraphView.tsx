"use client";

/**
 * React Flow view of a `ComboGraph`: nodes = maneuvers (with usage counts),
 * edges = maneuver→maneuver transitions labelled with their frequency. Simple
 * circular layout; nodes are draggable so the user can untangle busy graphs.
 */

import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ComboGraph } from "@/domain/combat-lab/analysis/combo";

export function ComboGraphView({ graph }: { graph: ComboGraph })
{
  const { nodes, edges } = useMemo(() => layout(graph), [graph]);

  if (graph.nodes.length === 0)
  {
    return <p className="text-sm text-muted-foreground">Brak użytych manewrów w tych walkach (spróbuj strategii „Skryptowana&quot; lub manewrów z efektami).</p>;
  }

  return (
    <>
    <div className="h-[min(480px,65dvh)] min-h-64 w-full overflow-hidden rounded border [&_.react-flow__controls-button]:min-h-11 [&_.react-flow__controls-button]:min-w-11">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false} edgesFocusable={false} zoomOnScroll={false} preventScrolling={false}>
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
    <details className="mt-3 rounded border p-3 text-sm">
      <summary className="cursor-pointer py-2">Manewry i połączenia</summary>
      <ul className="space-y-2 break-words">
        {graph.nodes.map(node => <li key={node.id}>{node.label}: {node.count}</li>)}
        {graph.edges.map(edge => <li key={edge.id}>{graph.nodes.find(node => node.id === edge.from)?.label ?? edge.from} → {graph.nodes.find(node => node.id === edge.to)?.label ?? edge.to}: {edge.count}</li>)}
      </ul>
    </details>
    </>
  );
}

function layout(graph: ComboGraph): { nodes: Node[]; edges: Edge[] }
{
  const n = graph.nodes.length;
  const radius = Math.max(140, n * 42);
  const maxEdge = Math.max(1, ...graph.edges.map(e => e.count));

  const nodes: Node[] = graph.nodes.map((node, i) =>
  {
    const angle = (2 * Math.PI * i) / Math.max(1, n);
    return {
      id: node.id,
      position: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
      data: { label: `${node.label} (${node.count})` },
      style: { fontSize: 12, borderRadius: 8, padding: 6 },
    };
  });

  const edges: Edge[] = graph.edges.map(edge => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: String(edge.count),
    animated: edge.count >= maxEdge * 0.6,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1 + (2 * edge.count) / maxEdge },
  }));

  return { nodes, edges };
}
