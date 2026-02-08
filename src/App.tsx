import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import LiveCall from "./pages/LiveCall";
import CalendarView from "./pages/CalendarView";
import CallLogs from "./pages/CallLogs";
import AgentSettings from "./pages/AgentSettings";
import PreferencesMemory from "./pages/PreferencesMemory";
import AgentThinking from "./pages/AgentThinking";
import NegotiationSimulator from "./pages/NegotiationSimulator";
import HumanInTheLoop from "./pages/HumanInTheLoop";
import VoicePersonaLab from "./pages/VoicePersonaLab";
import ReplayStudio from "./pages/ReplayStudio";
import MemoryMap from "./pages/MemoryMap";
import FailureForensics from "./pages/FailureForensics";
import ExperimentMode from "./pages/ExperimentMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/live-call" element={<LiveCall />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/call-logs" element={<CallLogs />} />
              <Route path="/settings" element={<AgentSettings />} />
              <Route path="/preferences" element={<PreferencesMemory />} />
              <Route path="/agent-thinking" element={<AgentThinking />} />
              <Route path="/simulator" element={<NegotiationSimulator />} />
              <Route path="/human-loop" element={<HumanInTheLoop />} />
              <Route path="/voice-lab" element={<VoicePersonaLab />} />
              <Route path="/replay" element={<ReplayStudio />} />
              <Route path="/memory-map" element={<MemoryMap />} />
              <Route path="/forensics" element={<FailureForensics />} />
              <Route path="/experiments" element={<ExperimentMode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
