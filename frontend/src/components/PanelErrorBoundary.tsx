import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class PanelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Panel Error Boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">error_outline</span>
          <p className="text-sm font-bold text-on-surface mb-2">
            {this.props.fallbackMessage || "This section could not load."}
          </p>
          <p className="text-xs text-on-surface-variant mb-4">
            An internal error prevented this content from rendering.
          </p>
          {this.props.onRetry && (
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onRetry?.();
              }}
              className="bg-on-surface/5 text-on-surface px-4 py-2 rounded-xl text-xs font-bold hover:bg-on-surface/10 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
