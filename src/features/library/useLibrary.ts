import { useEffect, useState } from "react";
import { IndexedLibraryStore } from "./storage";
import { LibrarySession } from "./application";
export function useLibrary() {
  const [session, setSession] = useState<LibrarySession | null>(null);
  const [loadError, setLoadError] = useState("");
  const [, changed] = useState(0);
  useEffect(() => {
    let disposed = false;
    const store = new IndexedLibraryStore();
    const current = new LibrarySession(store, () => {
      if (!disposed) changed((v) => v + 1);
    });
    current
      .load()
      .then(() => {
        if (!disposed) {
          try {
            if (localStorage.getItem("scoremap-view-mode") === "performance")
              current.setMode("performance");
          } catch {
            /* View preferences are optional; library integrity is independent. */
          }
          setSession(current);
        }
      })
      .catch((error: unknown) => {
        if (!disposed)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Local data could not be read.",
          );
      });
    return () => {
      disposed = true;
      void store.close();
    };
  }, []);
  return { session, loadError };
}
