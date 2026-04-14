/**
 * ErrorBoundary component
 *
 * Catches React errors and displays a fallback UI
 */

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-red-50 to-orange-50"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertTriangle
            size={32}
            className="text-red-600"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-center text-slate-900 mb-2">
          Something went wrong
        </h1>

        <p className="text-sm sm:text-base text-slate-600 text-center mb-6">
          The game encountered an error and couldn&apos;t continue. You can try
          reloading to start fresh.
        </p>

        <details className="mb-6">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 mb-2">
            Technical details
          </summary>
          <pre className="text-xs bg-slate-50 text-slate-700 p-3 rounded-lg overflow-auto max-h-40 border border-slate-200">
            {error.message}
            {error.stack && (
              <>
                {"\n\n"}
                {error.stack}
              </>
            )}
          </pre>
        </details>

        <button
          type="button"
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <RefreshCw size={18} aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
