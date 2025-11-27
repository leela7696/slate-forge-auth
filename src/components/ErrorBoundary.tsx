import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full border rounded-lg p-6 bg-background">
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mt-2">
                The page encountered an error. Please try reloading or contact support.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 rounded bg-muted p-3">
                  <p className="text-xs text-muted-foreground break-words">
                    Error: {this.state.error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
