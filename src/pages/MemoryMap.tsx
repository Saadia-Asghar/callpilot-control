import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { memoryMapNodes as initialNodes, memoryMapEdges, type MemoryNode } from "@/data/agentIntelligenceData";
import { useToast } from "@/hooks/use-toast";

const nodeColors = {
  user: { fill: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))", r: 24 },
  preference: { fill: "hsl(var(--info))", text: "hsl(var(--info-foreground))", r: 18 },
  booking: { fill: "hsl(var(--success))", text: "hsl(var(--success-foreground))", r: 16 },
};

function NodeDetail({ node, onEdit }: { node: MemoryNode; onEdit: (label: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);

  const handleSave = () => {
    onEdit(editValue);
    setEditing(false);
  };

  return (
    <GlassPanel className="animate-fade-in">
      <GlassPanelContent className="py-3 space-y-2">
        <div className="flex items-center justify-between">
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs" autoFocus />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}><Check className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-card-foreground">{node.label}</p>
              {node.type === "preference" && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditing(true)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium text-card-foreground capitalize">{node.type}</p>
          </div>
          {node.confidence !== undefined && (
            <div>
              <p className="text-muted-foreground">Confidence</p>
              <div className="flex items-center gap-1">
                <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${node.confidence * 100}%` }} />
                </div>
                <span className="font-mono text-card-foreground">{(node.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
          {node.decay !== undefined && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Memory Freshness</p>
              <div className="flex items-center gap-1">
                <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${node.decay > 70 ? "bg-success" : node.decay > 40 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${node.decay}%` }}
                  />
                </div>
                <span className="font-mono text-card-foreground text-[10px]">{node.decay}%</span>
              </div>
            </div>
          )}
        </div>
      </GlassPanelContent>
    </GlassPanel>
  );
}

export default function MemoryMap() {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const { toast } = useToast();

  const handleEditNode = (label: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, label } : n));
    setSelectedNode({ ...selectedNode, label });
    toast({ title: "Memory Updated", description: `Node updated to "${label}"` });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Network className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Memory Map</h1>
          <p className="text-sm text-muted-foreground">Visual graph of user preferences, bookings & confidence</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <GlassPanel glow>
            <GlassPanelHeader>
              <span className="text-xs font-medium text-card-foreground">Memory Graph</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> User</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" /> Preference</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Booking</span>
              </div>
            </GlassPanelHeader>
            <GlassPanelContent>
              <svg viewBox="0 0 900 420" className="w-full" style={{ minHeight: 350 }}>
                {memoryMapEdges.map((edge, i) => {
                  const from = nodes.find(n => n.id === edge.from);
                  const to = nodes.find(n => n.id === edge.to);
                  if (!from || !to) return null;
                  const isActive = selectedNode?.id === from.id || selectedNode?.id === to.id;
                  return (
                    <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isActive ? 2 : 1} opacity={isActive ? 0.8 : 0.3} />
                  );
                })}
                {nodes.map((node) => {
                  const config = nodeColors[node.type];
                  const isActive = selectedNode?.id === node.id;
                  return (
                    <motion.g key={node.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="cursor-pointer"
                      onClick={() => setSelectedNode(isActive ? null : node)}>
                      {node.decay !== undefined && (
                        <circle cx={node.x} cy={node.y} r={config.r + 4} fill="none"
                          stroke={node.decay > 70 ? "hsl(var(--success))" : node.decay > 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                          strokeWidth={1.5}
                          strokeDasharray={`${(node.decay / 100) * (2 * Math.PI * (config.r + 4))} ${2 * Math.PI * (config.r + 4)}`}
                          transform={`rotate(-90 ${node.x} ${node.y})`} opacity={0.6} />
                      )}
                      <circle cx={node.x} cy={node.y} r={config.r} fill={config.fill}
                        opacity={node.decay ? node.decay / 100 * 0.5 + 0.5 : 1}
                        stroke={isActive ? "hsl(var(--ring))" : "none"} strokeWidth={2} />
                      <text x={node.x} y={node.y + config.r + 14} textAnchor="middle"
                        fill="hsl(var(--muted-foreground))" fontSize={9} fontFamily="Inter, sans-serif">
                        {node.label}
                      </text>
                    </motion.g>
                  );
                })}
              </svg>
            </GlassPanelContent>
          </GlassPanel>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-card-foreground mb-3">Node Details</h2>
          {selectedNode ? (
            <NodeDetail node={selectedNode} onEdit={handleEditNode} />
          ) : (
            <GlassPanel>
              <GlassPanelContent>
                <p className="text-xs text-muted-foreground text-center py-4">Click a node to inspect</p>
              </GlassPanelContent>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
