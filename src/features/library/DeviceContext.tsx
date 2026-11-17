import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  DeviceConfigurationStore,
  savedDeviceConfiguration,
} from "./deviceConfigurations";
import type { PrivateLibraryStore } from "./privateStorage";
const Context = createContext<DeviceConfigurationStore | null>(null);
export function DeviceProvider({
  store,
  children,
}: {
  store: PrivateLibraryStore | undefined;
  children: ReactNode;
}) {
  const [resources] = useState(
    () =>
      new DeviceConfigurationStore(
        store?.identity.principal ?? "anonymous",
        store
          ? {
              list: () => store.request("/api/device-configurations"),
              mutate: (request) =>
                store.personal.mutate(
                  "device",
                  request,
                  savedDeviceConfiguration,
                ),
            }
          : undefined,
      ),
  );
  useEffect(
    () => () => {
      void resources.close();
    },
    [resources],
  );
  return <Context.Provider value={resources}>{children}</Context.Provider>;
}
export function useDeviceStore() {
  const store = useContext(Context);
  if (!store)
    throw new Error("Reusable configuration ownership is unavailable.");
  return store;
}
