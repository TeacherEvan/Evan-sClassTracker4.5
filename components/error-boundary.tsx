"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Improve error message for common date errors
    let errorMessage = error.message;
    if (error.message.includes("Invalid Date") || error.message.includes("invalid date")) {
      errorMessage = "invalid date";
    }

    return {
      hasError: true,
      error: { ...error, message: errorMessage } as Error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Extract meaningful error info
    const info = errorInfo && typeof errorInfo === 'object'
      ? JSON.stringify(errorInfo, null, 2)
      : String(errorInfo);

    this.setState({ errorInfo: info });
  }

  private getUserFriendlyMessage(): { title: string; message: string; emoji: string } {
    const errorMsg = this.state.error?.message?.toLowerCase() || "";

    // Detect error type and provide friendly message
    if (errorMsg.includes("invalid date") || errorMsg.includes("date")) {
      return {
        emoji: "📅",
        title: "Date Error",
        message: "We encountered an issue with a date value. This usually happens when viewing old or incomplete data. Please try refreshing the page."
      };
    }

    if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
      return {
        emoji: "🌐",
        title: "Connection Error",
        message: "Unable to connect to the server. Please check your internet connection and try again."
      };
    }

    if (errorMsg.includes("permission") || errorMsg.includes("unauthorized")) {
      return {
        emoji: "🔒",
        title: "Permission Error",
        message: "You don't have permission to access this resource. Please contact your administrator."
      };
    }

    // Default generic error
    return {
      emoji: "⚠️",
      title: "Application Error",
      message: "Something unexpected happened. Please try reloading the page. If the problem persists, contact support."
    };
  }

  render() {
    if (this.state.hasError) {
      const { emoji, title, message } = this.getUserFriendlyMessage();

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">{emoji}</div>
              <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    window.history.back();
                  }}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Go Back
                </button>
              </div>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40">
                    <strong>Error:</strong> {this.state.error.message}
                    {"\n\n"}
                    <strong>Stack:</strong>
                    {"\n"}
                    {this.state.error.stack}
                    {this.state.errorInfo && (
                      <>
                        {"\n\n"}
                        <strong>Component Stack:</strong>
                        {"\n"}
                        {this.state.errorInfo}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
