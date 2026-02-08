import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import LiveCall from "./pages/LiveCall";
import CalendarView from "./pages/CalendarView";
import CallLogs from "./pages/CallLogs";
import AgentSettings from "./pages/AgentSettings";
import PreferencesMemory from "./pages/PreferencesMemory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
