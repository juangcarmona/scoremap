import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LocalPresetStore,
  RemotePresetStore,
  type PresetStore,
} from "./presetStorage";
import type { PrivateLibraryStore } from "./privateStorage";
const Context = createContext<PresetStore | null>(null);
export function PresetProvider({
  store,
  children,
}: {
  store: PrivateLibraryStore | undefined;
  children: ReactNode;
}) {
  const [presets] = useState<PresetStore>(() =>
    store
      ? new RemotePresetStore(store.identity.principal, (path, init) =>
          store.request(path, init),
        )
      : new LocalPresetStore(),
  );
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 0 } },
      }),
  );
  useEffect(
    () => () => {
      client.clear();
      void presets.close?.();
    },
    [client, presets],
  );
  return (
    <Context.Provider value={presets}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </Context.Provider>
  );
}
export function usePresetStore() {
  const store = useContext(Context);
  if (!store) throw new Error("The preset owner scope is unavailable.");
  return store;
}
