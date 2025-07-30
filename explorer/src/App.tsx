import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import HomePage from "./pages/HomePage";
import ValidatorsPage from "./pages/ValidatorsPage";
import TransactionsPage from "./pages/TransactionsPage";
import BlocksPage from "./pages/BlocksPage";
import WellnessPage from "./pages/WellnessPage";
import Header from "./components/Header";
import Footer from "./components/Footer";

function Router() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/validators" component={ValidatorsPage} />
          <Route path="/transactions" component={TransactionsPage} />
          <Route path="/blocks" component={BlocksPage} />
          <Route path="/wellness" component={WellnessPage} />
          <Route component={HomePage} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;