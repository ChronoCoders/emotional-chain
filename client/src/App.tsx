import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import DocsPage from "@/pages/docs";
import WhitepaperPage from "@/pages/whitepaper";
import TerminalInterface from "@/pages/terminal";
import ExplorerApp from "@/pages/explorer/ExplorerApp";
import AIConsensusPage from "@/pages/AIConsensusPage";
import AILearningPage from "@/pages/AILearningPage";
import MonitoringDashboard from "@/pages/MonitoringDashboard";
import PrivacyDashboard from "@/pages/PrivacyDashboard";
import RoleBasedAccess from "@/components/auth/RoleBasedAccess";
import UserDashboard from "@/pages/UserDashboard";
import ValidatorDashboard from "@/pages/ValidatorDashboard";
import AdminPanel from "@/pages/AdminPanel";
import TokenomicsPage from "@/pages/TokenomicsPage";
import TokenomicsDocs from "@/pages/TokenomicsDocs";

function Router() {
  return (
    <Switch>
      {/* Role-based access routes */}
      <Route path="/access" component={() => <RoleBasedAccess />} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/validator" component={ValidatorDashboard} />
      <Route path="/admin" component={AdminPanel} />
      {/* Legacy terminal route for direct admin access */}
      <Route path="/terminal" component={TerminalInterface} />
      {/* Application routes */}
      <Route path="/docs" component={DocsPage} />
      <Route path="/whitepaper" component={WhitepaperPage} />
      <Route path="/tokenomics" component={TokenomicsPage} />
      <Route path="/tokenomics/docs" component={TokenomicsDocs} />
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
