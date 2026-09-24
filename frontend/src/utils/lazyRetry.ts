import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Enhanced lazy import with automatic retry on chunk / dynamic module load failure.
 * Fixes Vite HMR / cache invalidation and stale chunks during production updates.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retriesLeft = 2,
  intervalMs = 300,
): LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (retries: number) => {
        factory()
          .then(resolve)
          .catch((error: unknown) => {
            if (retries > 0) {
              setTimeout(() => {
                attempt(retries - 1);
              }, intervalMs);
            } else {
              // If dynamic import failed, check if we should try a window reload
              const hasRefreshed = sessionStorage.getItem("onebite_chunk_reload") === "true";
              const errorMsg = error instanceof Error ? error.message : String(error);
              const isDynamicImportError =
                errorMsg.includes("dynamically imported module") ||
                errorMsg.includes("Failed to fetch") ||
                errorMsg.includes("Loading chunk");

              if (isDynamicImportError && !hasRefreshed) {
                sessionStorage.setItem("onebite_chunk_reload", "true");
                window.location.reload();
                return;
              }

              sessionStorage.removeItem("onebite_chunk_reload");
              reject(error);
            }
          });
      };

      attempt(retriesLeft);
    }),
  );
}
