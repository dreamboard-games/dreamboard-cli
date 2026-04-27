import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import { ErrorBoundary, PluginRuntime } from "./components/dreamboard";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PluginRuntime>
      <App />
    </PluginRuntime>
  </ErrorBoundary>,
);
