import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDeviceStore } from "./DeviceContext";
import type { Device } from "./score";
export function CopyDeviceConfiguration({
  busy,
  copy,
}: {
  busy: boolean;
  copy: (device: Device) => void;
}) {
  const store = useDeviceStore();
  const resources = useQuery({
    queryKey: ["device-configurations", store.scope],
    queryFn: () => store.list(),
    retry: false,
  });
  const [selected, setSelected] = useState("");
  const saved = resources.data?.find((resource) => resource.id === selected);
  return (
    <fieldset disabled={busy || resources.isPending}>
      <legend>Copy a reusable keyboard configuration</legend>
      {resources.error && (
        <p role="alert">
          Configurations could not be loaded. Existing song keyboards stay
          unchanged.
          <button
            type="button"
            onClick={() => {
              void resources.refetch();
            }}
          >
            Retry reusable keyboard choices
          </button>
        </p>
      )}
      {resources.isPending && <p role="status">Loading configurations…</p>}
      {resources.isSuccess && resources.data.length === 0 && (
        <p>
          Create or import a reusable configuration in the library controls to
          copy it here.
        </p>
      )}
      <label>
        Reusable keyboard configuration
        <select
          aria-label="Reusable keyboard configuration"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Choose a saved configuration</option>
          {resources.data?.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.configuration!.name} · version {resource.revision}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!saved}
        onClick={() => {
          if (saved?.configuration)
            copy({
              ...structuredClone(saved.configuration),
              id: crypto.randomUUID(),
            });
        }}
      >
        Copy saved configuration into this arrangement
      </button>
      <p>
        The copy has a new identity. Parts, bindings and performed notes remain
        unchanged; assign parts explicitly afterwards.
      </p>
    </fieldset>
  );
}
