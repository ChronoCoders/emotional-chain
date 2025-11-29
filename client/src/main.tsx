import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR fallback error (wss://localhost:undefined)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('wss://localhost:undefined')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
