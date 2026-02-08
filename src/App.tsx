import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import LiveCall from "./pages/LiveCall";
import CalendarView from "./pages/CalendarView";
import CallLogs from "./pages/CallLogs";
import AgentSettings from "./pages/AgentSettings";
import PreferencesMemory from "./pages/PreferencesMemory";
import AgentThinking from "./pages/AgentThinking";
import NegotiationSimulator from "./pages/NegotiationSimulator";
import HumanInTheLoop from "./pages/HumanInTheLoop";
import VoiceCloneStudio from "./pages/VoiceCloneStudio";
import ReplayStudio from "./pages/ReplayStudio";
import MemoryMap from "./pages/MemoryMap";
import FailureForensics from "./pages/FailureForensics";
import ExperimentMode from "./pages/ExperimentMode";
import CallDrafts from "./pages/CallDrafts";
import CustomScripts from "./pages/CustomScripts";
import IndustryPresets from "./pages/IndustryPresets";
import MissedCallRecovery from "./pages/MissedCallRecovery";
import CallSimulation from "./pages/CallSimulation";
import ExportCRM from "./pages/ExportCRM";
import Feedback from "./pages/Feedback";
import AISuggestions from "./pages/AISuggestions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Onboarding />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/live-call" element={<LiveCall />} />
                      <Route path="/calendar" element={<CalendarView />} />
                      <Route path="/call-logs" element={<CallLogs />} />
                      <Route path="/settings" element={<AgentSettings />} />
                      <Route path="/preferences" element={<PreferencesMemory />} />
                      <Route path="/agent-thinking" element={<AgentThinking />} />
                      <Route path="/simulator" element={<NegotiationSimulator />} />
                      <Route path="/human-loop" element={<HumanInTheLoop />} />
                      <Route path="/voice-lab" element={<VoiceCloneStudio />} />
                      <Route path="/replay" element={<ReplayStudio />} />
                      <Route path="/memory-map" element={<MemoryMap />} />
                      <Route path="/forensics" element={<FailureForensics />} />
                      <Route path="/experiments" element={<ExperimentMode />} />
                      <Route path="/drafts" element={<CallDrafts />} />
                      <Route path="/scripts" element={<CustomScripts />} />
                      <Route path="/presets" element={<IndustryPresets />} />
                      <Route path="/recovery" element={<MissedCallRecovery />} />
                      <Route path="/simulation" element={<CallSimulation />} />
                      <Route path="/export" element={<ExportCRM />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/ai-suggestions" element={<AISuggestions />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
