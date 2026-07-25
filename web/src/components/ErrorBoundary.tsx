/**
 * @fileoverview Global Error Boundary component to handle uncaught React errors gracefully.
 */
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base text-on-surface p-lg">
            <span className="material-symbols-outlined text-error text-[48px] mb-md">warning</span>
            <h2 className="font-title-lg text-title-lg mb-sm">Something went wrong</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">
              We encountered an unexpected error. Please refresh or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-on-primary font-label-md text-label-md px-md py-sm rounded-lg hover:bg-primary-fixed transition-colors"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
