import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TerminalInterface from "@/pages/terminal";
import ExplorerApp from "@/pages/explorer/ExplorerApp";
import AIConsensusPage from "@/pages/AIConsensusPage";

function Router() {
  return (
    <Switch>
      <Route path="/explorer" component={ExplorerApp} />
      <Route path="/explorer/*" component={ExplorerApp} />
      <Route path="/ai-consensus" component={AIConsensusPage} />
      <Route path="/" component={TerminalInterface} />
      <Route component={TerminalInterface} />
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
