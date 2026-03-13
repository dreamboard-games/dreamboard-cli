/**
 * ErrorBoundary component fixtures
 * Demonstrates error handling and fallback states
 */
import React from "react";
import { ErrorBoundary } from "../ErrorBoundary.js";

// Component that throws an error
function BuggyComponent(): never {
  throw new Error("This is a test error for the ErrorBoundary fixture");
}

// Component that works fine
function WorkingComponent() {
  return (
    <div className="p-6 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-green-800 font-semibold">✓ Working Component</h3>
      <p className="text-green-600 mt-2">
        This component renders without errors.
      </p>
    </div>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-100 p-8">{children}</div>;
}

export default {
  withError: (
    <Container>
      <h2 className="text-xl font-bold mb-4">ErrorBoundary with Error</h2>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.log("[Fixture] Error caught:", error.message);
          console.log("[Fixture] Error info:", errorInfo);
        }}
      >
        <BuggyComponent />
      </ErrorBoundary>
    </Container>
  ),

  withWorkingChild: (
    <Container>
      <h2 className="text-xl font-bold mb-4">
        ErrorBoundary with Working Child
      </h2>
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    </Container>
  ),

  customFallback: (
    <Container>
      <h2 className="text-xl font-bold mb-4">
        ErrorBoundary with Custom Fallback
      </h2>
      <ErrorBoundary
        fallback={
          <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-purple-800 font-semibold">
              🎮 Custom Error UI
            </h3>
            <p className="text-purple-600 mt-2">
              Something went wrong in the game. Please refresh to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Refresh Game
            </button>
          </div>
        }
      >
        <BuggyComponent />
      </ErrorBoundary>
    </Container>
  ),
};
