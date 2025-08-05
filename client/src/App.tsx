import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import TerminalInterface from "@/pages/terminal";
import ExplorerApp from "@/pages/explorer/ExplorerApp";
import AIConsensusPage from "@/pages/AIConsensusPage";
import AILearningPage from "@/pages/AILearningPage";
import MonitoringDashboard from "@/pages/MonitoringDashboard";
import PrivacyDashboard from "@/pages/PrivacyDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={TerminalInterface} />
      <Route path="/explorer" component={ExplorerApp} />
      <Route path="/explorer/*" component={ExplorerApp} />
      <Route path="/ai-consensus" component={AIConsensusPage} />
      <Route path="/ai-learning" component={AILearningPage} />
      <Route path="/monitoring" component={MonitoringDashboard} />
      <Route path="/privacy" component={PrivacyDashboard} />
      <Route path="/" component={LandingPage} />
      <Route component={LandingPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
