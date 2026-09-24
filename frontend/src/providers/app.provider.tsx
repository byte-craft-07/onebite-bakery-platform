import React from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/auth.context";
import { ToastProvider } from "@/contexts/toast.context";
import { PWAProvider } from "@/contexts/pwa.context";
import { ToastContainer } from "@/components/ui/Toast";
import { extractErrorMessage } from "@/utils/errorHandler";
import { toast } from "@/contexts/toast.context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for queries that have already loaded data once (background refetch failures).
      // Initial load failures are handled by the component's own error/loading state.
      if (query.state.data !== undefined) {
        const message = extractErrorMessage(error, "Failed to refresh data.");
        toast.error("Sync Error", message);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only show a global toast for mutations that don't have their own onError handler.
      // This prevents double-toasting on mutations that already handle errors locally.
      if (!mutation.options.onError) {
        const message = extractErrorMessage(error, "Action failed. Please try again.");
        toast.error("Error", message);
      }
    },
  }),
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PWAProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </PWAProvider>
    </QueryClientProvider>
  );
};
