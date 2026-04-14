import { createRoot } from "react-dom/client";
import { RuntimeProvider } from "@dreamboard/ui-sdk/internal/runtime-context";
import { usePluginRuntime } from "@dreamboard/ui-sdk/internal/usePluginRuntime";
import "./style.css";
import App from "./App";

function PluginRoot() {
  const { runtime, isReady, error } = usePluginRuntime();

  if (error) {
    return <div role="alert">{error}</div>;
  }

  if (!isReady) {
    return <div>Waiting for game state...</div>;
  }

  return (
    <RuntimeProvider runtime={runtime}>
      <App />
    </RuntimeProvider>
  );
}

createRoot(document.getElementById("root")!).render(<PluginRoot />);
