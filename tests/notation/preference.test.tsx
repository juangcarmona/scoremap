import { PersonalEditProvider } from "../../src/shared/personalEdit/PersonalEditBarrier";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  NotationControl,
  NotationProvider,
} from "../../src/features/notation/NotationPreference";
import type {
  NotationSettings,
  NotationStore,
} from "../../src/shared/music/notation";
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
it("invalid device settings fall back safely and a choice survives a remount", async () => {
  localStorage.setItem(
    "scoremap-notation",
    '{"mode":"unknown","primary":"latin"}',
  );
  const first = render(
    <NotationProvider>
      <NotationControl />
    </NotationProvider>,
  );
  expect(screen.getByLabelText("Note names")).toHaveValue("anglo");
  await userEvent.selectOptions(
    screen.getByLabelText("Note names"),
    "dual-latin",
  );
  expect(JSON.parse(localStorage.getItem("scoremap-notation")!)).toEqual({
    mode: "dual",
    primary: "latin",
  });
  first.unmount();
  render(
    <NotationProvider>
      <NotationControl />
    </NotationProvider>,
  );
  expect(screen.getByLabelText("Note names")).toHaveValue("dual-latin");
});
it("a refused device write stays displayed as unsaved rather than claiming success", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage is full");
  });
  render(
    <NotationProvider>
      <NotationControl />
    </NotationProvider>,
  );
  await userEvent.selectOptions(screen.getByLabelText("Note names"), "latin");
  expect(screen.getByLabelText("Note names")).toHaveValue("latin");
  expect(screen.getByRole("status")).toHaveTextContent(
    "Note-name choice not saved",
  );
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
});
it("account settings ignore anonymous preference and a failed acknowledgement retries the same command", async () => {
  localStorage.setItem(
    "scoremap-notation",
    '{"mode":"latin","primary":"latin"}',
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const saved: NotationSettings = {
    revision: 4,
    mode: "anglo",
    primary: "anglo",
  };
  const save = vi
    .fn<NotationStore["save"]>()
    .mockRejectedValueOnce(new Error("No acknowledgement"))
    .mockImplementationOnce(async (request) => ({
      revision: 5,
      mode: request.mode,
      primary: request.primary,
    }));
  const store: NotationStore = { read: async () => saved, save };
  render(
    <QueryClientProvider client={client}>
      <PersonalEditProvider>
        <NotationProvider principal="synthetic-A" store={store}>
          <NotationControl />
        </NotationProvider>
      </PersonalEditProvider>
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Note names")).toBeEnabled(),
  );
  expect(screen.getByLabelText("Note names")).toHaveValue("anglo");
  await userEvent.selectOptions(
    screen.getByLabelText("Note names"),
    "dual-latin",
  );
  await screen.findByText("Note-name choice not saved");
  expect(screen.getByLabelText("Note names")).toHaveValue("dual-latin");
  await userEvent.click(
    screen.getByRole("button", { name: "Retry note names" }),
  );
  await screen.findByText("Note names saved to your account");
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1]![0]).toEqual(save.mock.calls[0]![0]);
  expect(save.mock.calls[0]![0].expectedRevision).toBe(4);
  expect(JSON.parse(localStorage.getItem("scoremap-notation")!)).toEqual({
    mode: "latin",
    primary: "latin",
  });
});
it("switching principals discards the previous account's pending preference", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const storeA: NotationStore = {
    read: async () => ({ revision: 0, mode: "anglo", primary: "anglo" }),
    save: async () => {
      throw new Error("A is unacknowledged");
    },
  };
  const saveB = vi.fn<NotationStore["save"]>();
  const storeB: NotationStore = {
    read: async () => ({ revision: 8, mode: "latin", primary: "latin" }),
    save: saveB,
  };
  const content = (principal: string, store: NotationStore) => (
    <QueryClientProvider client={client}>
      <PersonalEditProvider>
        <NotationProvider principal={principal} store={store}>
          <NotationControl />
        </NotationProvider>
      </PersonalEditProvider>
    </QueryClientProvider>
  );
  const view = render(content("A", storeA));
  await waitFor(() =>
    expect(screen.getByLabelText("Note names")).toBeEnabled(),
  );
  await userEvent.selectOptions(
    screen.getByLabelText("Note names"),
    "dual-anglo",
  );
  await screen.findByText("Note-name choice not saved");
  view.rerender(content("B", storeB));
  await waitFor(() =>
    expect(screen.getByLabelText("Note names")).toHaveValue("latin"),
  );
  expect(screen.queryByText("A is unacknowledged")).not.toBeInTheDocument();
  expect(saveB).not.toHaveBeenCalled();
  expect(client.getQueryData(["notation", "A"])).toBeUndefined();
});
