import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// CRITICAL: Suppress Vite HMR fallback error BEFORE anything loads
(function suppressHMRError() {
  const hmrPattern = 'wss://localhost:undefined';
  
  // Capture original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Override console.error to filter HMR errors
  console.error = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    if (!message.includes(hmrPattern)) {
      originalError.apply(console, args);
    }
  };
  
  // Override console.warn to filter HMR errors
  console.warn = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    if (!message.includes(hmrPattern)) {
      originalWarn.apply(console, args);
    }
  };

  // Prevent unhandledrejection events for HMR errors
  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason?.message?.includes(hmrPattern) || 
        (typeof reason === 'string' && reason.includes(hmrPattern))) {
      event.preventDefault();
    }
  };
  window.addEventListener('unhandledrejection', handleRejection, true);

  // Prevent error events for HMR
  const handleError = (event: ErrorEvent) => {
    if (event.message?.includes(hmrPattern)) {
      event.preventDefault();
      return true;
    }
  };
  window.addEventListener('error', handleError, true);
})();

createRoot(document.getElementById("root")!).render(<App />);
