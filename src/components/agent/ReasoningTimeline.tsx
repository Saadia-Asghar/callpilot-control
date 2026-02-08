import { useState } from "react";
import { ChevronRight, ChevronDown, Brain, Wrench, XCircle, CheckCircle2, Zap, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReasoningNode } from "@/data/agentIntelligenceData";

const typeConfig = {
  intent: { icon: Brain, color: "text-primary", bg: "bg-primary/10" },
  constraint: { icon: Zap, color: "text-warning", bg: "bg-warning/10" },
  tool_consider: { icon: Wrench, color: "text-muted-foreground", bg: "bg-muted" },
  tool_select: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  rejection: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  decision: { icon: Brain, color: "text-info", bg: "bg-info/10" },
  negotiation: { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
};

function ReasoningNodeItem({ node, depth = 0 }: { node: ReasoningNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const config = typeConfig[node.type];
  const Icon = config.icon;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute left-3 top-0 -bottom-0 w-px bg-border" />
      )}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`relative flex items-start gap-3 ${depth > 0 ? "ml-6 pl-3" : ""}`}
      >
        {/* Timeline dot */}
        <div className={`relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bg} ${node.status === 'active' ? 'ring-2 ring-primary/40 animate-pulse-soft' : ''}`}>
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => hasChildren && setExpanded(!expanded)}
            className="flex items-center gap-1.5 w-full text-left group"
          >
            {hasChildren && (
              expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-xs font-semibold text-card-foreground">{node.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">{node.timestamp}</span>
          </button>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{node.detail}</p>
          {node.confidence !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1 flex-1 max-w-[100px] rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-primary" style={{ width: `${node.confidence * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{(node.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-2">
              {node.children!.map((child) => (
                <ReasoningNodeItem key={child.id} node={child} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ReasoningTimeline({ nodes }: { nodes: ReasoningNode[] }) {
  return (
    <div className="space-y-3 relative">
      {/* Main timeline line */}
      <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />
      {nodes.map((node) => (
        <ReasoningNodeItem key={node.id} node={node} />
      ))}
    </div>
  );
}
