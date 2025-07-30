import { Switch, Route, useLocation } from "wouter";
import ExplorerHomePage from "./ExplorerHomePage";
import ExplorerValidatorsPage from "./ExplorerValidatorsPage";
import ExplorerTransactionsPage from "./ExplorerTransactionsPage";
import ExplorerBlocksPage from "./ExplorerBlocksPage";
import ExplorerWellnessPage from "./ExplorerWellnessPage";
import ExplorerHeader from "./components/ExplorerHeader";
import ExplorerFooter from "./components/ExplorerFooter";

export default function ExplorerApp() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ExplorerHeader />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/explorer" component={ExplorerHomePage} />
          <Route path="/explorer/validators" component={ExplorerValidatorsPage} />
          <Route path="/explorer/transactions" component={ExplorerTransactionsPage} />
          <Route path="/explorer/blocks" component={ExplorerBlocksPage} />
          <Route path="/explorer/wellness" component={ExplorerWellnessPage} />
          <Route component={ExplorerHomePage} />
        </Switch>
      </main>
      <ExplorerFooter />
    </div>
  );
}