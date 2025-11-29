import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// CRITICAL: Suppress Vite HMR fallback error BEFORE React renders
(function suppressHMRError() {
  // Monkey-patch Promise.reject to suppress HMR errors
  const origPromiseReject = Promise.reject;
  (Promise.reject as any) = function(reason: any) {
    if (reason?.message?.includes('wss://localhost:undefined')) {
      return Promise.resolve(); // Silently resolve instead of reject
    }
    return origPromiseReject.call(this, reason);
  };

  // Suppress unhandledrejection
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('wss://localhost:undefined')) {
      event.preventDefault();
    }
  }, true);

  // Suppress error events
  window.addEventListener('error', (event) => {
    if (event.message?.includes('wss://localhost:undefined')) {
      event.preventDefault();
    }
  }, true);
})();

createRoot(document.getElementById("root")!).render(<App />);
