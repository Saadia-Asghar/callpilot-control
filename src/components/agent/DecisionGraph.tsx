import { useState } from "react";
import { motion } from "framer-motion";
import type { GraphNode, GraphEdge } from "@/data/agentIntelligenceData";

const nodeStyles = {
  start: { fill: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))" },
  decision: { fill: "hsl(var(--info))", text: "hsl(var(--info-foreground))" },
  tool: { fill: "hsl(var(--warning))", text: "hsl(var(--warning-foreground))" },
  response: { fill: "hsl(var(--success))", text: "hsl(var(--success-foreground))" },
  outcome: { fill: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))" },
  rejected: { fill: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" },
};

export function DecisionGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const width = 600;
  const height = 500;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[600px] mx-auto" style={{ minHeight: 400 }}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from);
          const to = nodes.find(n => n.id === edge.to);
          if (!from || !to) return null;
          const isHighlighted = edge.chosen || hoveredNode === edge.from || hoveredNode === edge.to;
          return (
            <g key={i}>
              <line
                x1={from.x} y1={from.y + 18}
                x2={to.x} y2={to.y - 18}
                stroke={edge.chosen ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeDasharray={edge.chosen ? undefined : "4 4"}
                opacity={isHighlighted ? 1 : 0.4}
              />
              {edge.label && (
                <text
                  x={(from.x + to.x) / 2 + 8}
                  y={(from.y + to.y) / 2 + 4}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={9}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const style = nodeStyles[node.type];
          const isActive = hoveredNode === node.id;
          const dim = !node.chosen && !isActive;
          return (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: dim ? 0.4 : 1 }}
              transition={{ delay: nodes.indexOf(node) * 0.05 }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              <rect
                x={node.x - 60} y={node.y - 16}
                width={120} height={32}
                rx={8}
                fill={style.fill}
                opacity={node.chosen ? 1 : 0.5}
                stroke={isActive ? "hsl(var(--ring))" : "none"}
                strokeWidth={2}
              />
              {node.chosen && (
                <rect
                  x={node.x - 62} y={node.y - 18}
                  width={124} height={36}
                  rx={10}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1}
                  opacity={0.3}
                />
              )}
              <text
                x={node.x} y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={style.text}
                fontSize={10}
                fontWeight={600}
                fontFamily="Inter, sans-serif"
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
