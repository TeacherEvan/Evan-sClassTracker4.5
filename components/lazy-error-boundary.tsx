import React from "react";

// Augment the global Window interface to optionally include reportError.
// Some environments (or polyfills) may define this, but it's not part of the
// standard lib.dom.d.ts typings.
declare global {
  interface Window {
    reportError?: (error: unknown) => void;
  }
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // If present, prefer the platform/runtime error reporting hook.
    window.reportError?.(error);

    // Log for debugging purposes.
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

export default function LazyErrorBoundary({ children }: Props) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
