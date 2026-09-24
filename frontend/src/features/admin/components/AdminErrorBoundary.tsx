import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ClipboardCopy, RefreshCw } from "lucide-react";

interface AdminErrorBoundaryProps {
  children: ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
}

/**
 * Admin-specific error boundary that catches rendering errors in admin pages
 * while keeping the Sidebar, Topbar, and real-time order notifications fully operational.
 *
 * Provides:
 * - Clear error diagnostics card with the error message
 * - "Try Again" button to reset the error and retry
 * - "Copy Error Details" for quick bug reporting
 * - "Return to Dashboard" for safe navigation
 */
export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  public state: AdminErrorBoundaryState = {
    hasError: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[Admin Error Boundary]", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, copied: false });
  };

  private handleGoToDashboard = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, copied: false });
    window.location.href = "/admin/dashboard";
  };

  private handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const details = [
      `Error: ${error?.message ?? "Unknown error"}`,
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      "",
      "Stack Trace:",
      error?.stack ?? "Not available",
      "",
      "Component Stack:",
      errorInfo?.componentStack ?? "Not available",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      // Fallback: select a textarea
      const textarea = document.createElement("textarea");
      textarea.value = details;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-8 shadow-xl">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Page Error
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">
              This admin page encountered an unexpected error. The rest of the
              admin panel (sidebar, notifications, order alerts) is still
              working normally.
            </p>

            {/* Error Details Box */}
            <div className="bg-red-50/60 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-mono text-red-700 break-all line-clamp-4">
                {this.state.error?.message ?? "An unexpected error occurred."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#596B58] hover:bg-[#495948] text-white text-sm font-semibold rounded-xl shadow transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                type="button"
                onClick={this.handleCopyError}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <ClipboardCopy className="w-4 h-4" />
                {this.state.copied ? "Copied!" : "Copy Error Details"}
              </button>

              <button
                type="button"
                onClick={this.handleGoToDashboard}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
