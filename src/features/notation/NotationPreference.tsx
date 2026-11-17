import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NotationContext,
  useNotation,
} from "../../shared/music/NotationContext";
import {
  defaultNotation,
  validNotation,
  type Notation,
  type NotationRequest,
  type NotationStore,
} from "../../shared/music/notation";

export function NotationProvider({
  store,
  principal,
  children,
}: {
  store?: NotationStore;
  principal?: string;
  children: ReactNode;
}) {
  return store && principal ? (
    <AccountNotation key={principal} store={store} principal={principal}>
      {children}
    </AccountNotation>
  ) : (
    <DeviceNotation>{children}</DeviceNotation>
  );
}
function DeviceNotation({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Notation>(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem("scoremap-notation") ?? "null",
      );
      return validNotation(value) ? value : defaultNotation;
    } catch {
      return defaultNotation;
    }
  });
  const [error, setError] = useState("");
  function choose(value: Notation) {
    if (!validNotation(value)) return;
    setPreference(value);
    try {
      localStorage.setItem("scoremap-notation", JSON.stringify(value));
      setError("");
    } catch {
      setError(
        "This notation choice is displayed but could not be saved on this device.",
      );
    }
  }
  return (
    <NotationContext.Provider
      value={{
        preference,
        choose,
        pending: !!error,
        loading: false,
        error,
        scope: "device",
        retry: () => choose(preference),
        reload: () => undefined,
      }}
    >
      {children}
    </NotationContext.Provider>
  );
}
function AccountNotation({
  store,
  principal,
  children,
}: {
  store: NotationStore;
  principal: string;
  children: ReactNode;
}) {
  const client = useQueryClient();
  const saved = useQuery({
    queryKey: ["notation", principal],
    queryFn: async () => {
      const value = await store.read();
      if (
        !validNotation(value) ||
        !Number.isSafeInteger(value.revision) ||
        value.revision < 0
      )
        throw new Error(
          "Saved note-name settings could not be read. Music is unchanged; Anglo-American labels are displayed until settings can be loaded.",
        );
      return value;
    },
    retry: false,
  });
  const [draft, setDraft] = useState<Notation | null>(null);
  const retry = useRef<NotationRequest | null>(null);
  const active = useRef(true);
  const mutation = useMutation({
    mutationFn: (request: NotationRequest) => store.save(request),
    onSuccess: (acknowledged) => {
      if (!active.current) return;
      client.setQueryData(["notation", principal], acknowledged);
      setDraft(null);
      retry.current = null;
    },
  });
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      client.removeQueries({ queryKey: ["notation", principal] });
    };
  }, [client, principal]);
  function choose(preference: Notation) {
    if (!saved.data || mutation.isPending || !validNotation(preference)) return;
    setDraft(preference);
    const previous = retry.current;
    const request =
      previous &&
      previous.mode === preference.mode &&
      previous.primary === preference.primary
        ? previous
        : {
            ...preference,
            expectedRevision: saved.data.revision,
            commandId: crypto.randomUUID(),
          };
    retry.current = request;
    mutation.mutate(request);
  }
  const error = saved.error?.message ?? mutation.error?.message ?? "";
  return (
    <NotationContext.Provider
      value={{
        preference: draft ?? saved.data ?? defaultNotation,
        choose,
        pending: draft !== null,
        loading: saved.isPending || mutation.isPending,
        error,
        scope: "account",
        retry: () => {
          if (saved.isError) void saved.refetch();
          else if (draft) choose(draft);
        },
        reload: () => {
          void saved.refetch().then((result) => {
            if (result.isSuccess) {
              setDraft(null);
              retry.current = null;
              mutation.reset();
            }
          });
        },
      }}
    >
      {children}
    </NotationContext.Provider>
  );
}
export function NotationControl() {
  const selectId = useId();
  const state = useNotation();
  const value =
    state.preference.mode === "dual"
      ? `dual-${state.preference.primary}`
      : state.preference.mode;
  return (
    <div className="notation-control">
      <label htmlFor={selectId}>Note names</label>
      <select
        id={selectId}
        value={value}
        disabled={state.loading}
        onChange={(event) => {
          const value = event.target.value;
          state.choose(
            value === "dual-anglo" || value === "dual-latin"
              ? {
                  mode: "dual",
                  primary: value === "dual-latin" ? "latin" : "anglo",
                }
              : {
                  mode: value === "latin" ? "latin" : "anglo",
                  primary: value === "latin" ? "latin" : "anglo",
                },
          );
        }}
      >
        <option value="anglo">C D E · Anglo-American</option>
        <option value="latin">Do Re Mi · Latin</option>
        <option value="dual-anglo">C (Do) · Both, Anglo-American first</option>
        <option value="dual-latin">Do (C) · Both, Latin first</option>
      </select>
      <span role="status">
        {state.loading
          ? "Saving or loading note names…"
          : state.error || state.pending
            ? "Note-name choice not saved"
            : state.scope === "account"
              ? "Note names saved to your account"
              : "Note names saved on this device"}
      </span>
      {state.error && (
        <p role="alert">
          {state.error}{" "}
          <button type="button" onClick={state.retry}>
            Retry note names
          </button>
          {state.scope === "account" && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Discard only the pending note-name choice and load your current saved setting? Musical changes are unaffected.",
                  )
                )
                  state.reload();
              }}
            >
              Load saved note names
            </button>
          )}
        </p>
      )}
    </div>
  );
}
