import React from "react";

import { AppProvider } from "@/providers/app.provider";
import { AppRoutes } from "@/routes/app.routes";
import { ErrorBoundary } from "@/routes/ErrorBoundary";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
