import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import BattleArena from "./pages/BattleArena";
import AlgorithmRealms from "./pages/AlgorithmRealms";
import GraphCity from "./pages/GraphCity";
import Practice from "./pages/Practice";
import Profiler from "./pages/Profiler";
import Visualizer from "./pages/Visualizer";
import SearchingZone from "./pages/SearchingZone";
import NotFound from "./pages/NotFound";
import ValidationDashboard from "./pages/ValidationDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/battle" element={<BattleArena />} />
            <Route path="/realms" element={<AlgorithmRealms />} />
            <Route path="/graph" element={<GraphCity />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/profiler" element={<Profiler />} />
            <Route path="/visualizer" element={<Visualizer />} />
            <Route path="/searching" element={<SearchingZone />} />
            <Route path="/validation" element={<ValidationDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
