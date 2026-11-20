import { expect, it, vi } from "vitest";
import {
  getApiPreferencesNotation,
  putApiSongsByIdGrants,
  type Transport,
} from "../../src/shared/api/private-client.gen";

it("delegates typed operations to the existing transport with an encoded path and JSON body", async () => {
  const send = vi.fn(async () => undefined);
  const transport = send as unknown as Transport;
  await putApiSongsByIdGrants(
    transport,
    { id: "song/other ?" },
    { principal: "synthetic", role: "viewer", mode: "edit" },
  );
  expect(send).toHaveBeenCalledWith("/api/songs/song%2Fother%20%3F/grants", {
    method: "PUT",
    body: JSON.stringify({
      principal: "synthetic",
      role: "viewer",
      mode: "edit",
    }),
  });
});

it("preserves failures from the supplied authenticated transport", async () => {
  const transport = (async () => {
    throw new Error("session locked");
  }) as Transport;
  await expect(getApiPreferencesNotation(transport)).rejects.toThrow(
    "session locked",
  );
});
