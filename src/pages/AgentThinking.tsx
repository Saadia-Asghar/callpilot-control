import { Brain, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassPanel, GlassPanelHeader, GlassPanelContent } from "@/components/agent/GlassPanel";
import { ReasoningTimeline } from "@/components/agent/ReasoningTimeline";
import { DecisionGraph } from "@/components/agent/DecisionGraph";
import { reasoningStream, decisionGraphNodes, decisionGraphEdges } from "@/data/agentIntelligenceData";

export default function AgentThinking() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Thinking</h1>
          <p className="text-sm text-muted-foreground">Reasoning stream & decision graph for active call</p>
        </div>
      </div>

      <Tabs defaultValue="reasoning" className="space-y-4">
        <TabsList className="glass-panel border-0 p-1">
          <TabsTrigger value="reasoning" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
            <Brain className="h-3.5 w-3.5" /> Reasoning Stream
          </TabsTrigger>
          <TabsTrigger value="graph" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
            <GitBranch className="h-3.5 w-3.5" /> Decision Graph
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reasoning">
          <GlassPanel>
            <GlassPanelHeader>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                <span className="text-xs font-medium text-card-foreground">Live Reasoning — Call #1847</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Duration: 0:28</span>
            </GlassPanelHeader>
            <GlassPanelContent>
              <ReasoningTimeline nodes={reasoningStream} />
            </GlassPanelContent>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="graph">
          <GlassPanel>
            <GlassPanelHeader>
              <span className="text-xs font-medium text-card-foreground">Decision Graph — Call #1847</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Chosen path</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Alternative</span>
              </div>
            </GlassPanelHeader>
            <GlassPanelContent>
              <DecisionGraph nodes={decisionGraphNodes} edges={decisionGraphEdges} />
            </GlassPanelContent>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
