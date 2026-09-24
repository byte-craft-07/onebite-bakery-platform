import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  /** Friendly label for the section that failed, e.g. "Page content" */
  sectionName?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * A lightweight error boundary for public-facing layout sections.
 * Catches rendering errors in the page content area while keeping
 * the Navbar, Footer, and cart drawer fully operational.
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  public state: SectionErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Section Error Boundary]", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      const isDynamicImportError =
        this.state.error?.message?.includes("dynamically imported module") ||
        this.state.error?.message?.includes("Failed to fetch") ||
        this.state.error?.message?.includes("Loading chunk");

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isDynamicImportError
                ? "Update Available"
                : "Oops! Something went wrong"}
            </h2>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {isDynamicImportError
                ? "A new version is available or there was a brief network interruption. Please refresh to continue."
                : `We couldn't load this ${this.props.sectionName ?? "page"}. Don't worry — the rest of the app is working fine.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={isDynamicImportError ? () => window.location.reload() : this.handleRetry}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#596B58] hover:bg-[#495948] text-white text-sm font-semibold rounded-xl shadow transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {isDynamicImportError ? "Refresh Page" : "Try Again"}
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
