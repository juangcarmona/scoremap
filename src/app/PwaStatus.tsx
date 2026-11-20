import { useEffect, useState } from "react";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function PwaStatus({
  beforeUpdate,
  report,
  privateLibrary = false,
}: {
  privateLibrary?: boolean;
  beforeUpdate: () => Promise<() => void>;
  report: (error: unknown) => void;
}) {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    const prompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const removers: (() => void)[] = [];
    const inspect = () => {
      if (registration?.waiting && !disposed) setWaiting(registration.waiting);
      const worker = registration?.installing;
      if (!worker) return;
      const changed = () => {
        if (
          worker.state === "installed" &&
          navigator.serviceWorker.controller &&
          !disposed
        )
          setWaiting(worker);
      };
      worker.addEventListener("statechange", changed);
      removers.push(() => worker.removeEventListener("statechange", changed));
    };
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (disposed) return;
        registration = reg;
        inspect();
        reg.addEventListener("updatefound", inspect);
        removers.push(() => reg.removeEventListener("updatefound", inspect));
      })
      .catch(report);
    return () => {
      disposed = true;
      removers.forEach((remove) => remove());
    };
  }, [report]);
  async function applyUpdate() {
    const release = await beforeUpdate();
    if (!waiting) {
      release();
      return;
    }
    if (waiting.state === "activated") {
      location.reload();
      return;
    }
    await new Promise<void>((resolve, reject) => {
      // Reload only for this tab's explicit action, including fast/external worker updates.
      const changed = () => {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          changed,
        );
        resolve();
        location.reload();
      };
      const timer = setTimeout(() => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          changed,
        );
        reject(
          new Error(
            "The update did not activate. Your saved music is safe; try again.",
          ),
        );
      }, 10000);
      navigator.serviceWorker.addEventListener("controllerchange", changed);
      waiting.postMessage({ type: "SKIP_WAITING" });
    }).catch((error: unknown) => {
      release();
      throw error;
    });
  }
  return (
    <>
      {offline && (
        <span className="offline-label">
          {privateLibrary
            ? "Offline · protected private copy"
            : "Offline · local library"}
        </span>
      )}
      {install && (
        <button
          type="button"
          onClick={() => {
            void install
              .prompt()
              .then(() => install.userChoice)
              .then(() => setInstall(null))
              .catch(report);
          }}
        >
          Install ScoreMap
        </button>
      )}
      {waiting && (
        <button
          type="button"
          className="update-button"
          onClick={() => {
            void applyUpdate().catch(report);
          }}
        >
          Apply available update
        </button>
      )}
    </>
  );
}
