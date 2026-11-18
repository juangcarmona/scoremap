// @vitest-environment node
import { expect, it } from "vitest";
import {
  DeviceConfigurationStore,
  deviceConfiguration,
  exportDeviceConfiguration,
  importDeviceConfiguration,
} from "../../src/features/library/deviceConfigurations";
const configuration = {
  id: "configuration",
  name: "Lower keyboard",
  instrument: "keyboard",
  range: [21, 108] as [number, number],
};
it("acknowledges a configuration separately, preserves copied content and reconciles stable commands", async () => {
  const store = new DeviceConfigurationStore(
    "anonymous",
    undefined,
    `devices-${crypto.randomUUID()}`,
  );
  const request = {
    operation: "save" as const,
    id: configuration.id,
    expectedRevision: 0,
    mode: "edit" as const,
    content: configuration,
  };
  const saved = await store.mutate(request, "stable-command");
  const copy = {
    ...structuredClone(saved.configuration!),
    id: "song-owned-copy",
  };
  expect(await store.mutate(request, "stable-command")).toEqual(saved);
  expect(
    (
      await store.mutate({
        ...request,
        expectedRevision: 1,
        content: { ...configuration, name: "Updated", range: [36, 96] },
      })
    ).revision,
  ).toBe(2);
  expect(copy).toEqual({ ...configuration, id: "song-owned-copy" });
  await expect(store.mutate(request)).rejects.toThrow(/Newer/);
  const before = await store.list();
  await expect(
    store.mutate({ ...request, expectedRevision: 2, mode: "performance" }),
  ).rejects.toThrow(/Edit/);
  await expect(
    store.mutate({
      ...request,
      expectedRevision: 2,
      content: { ...configuration, range: [108, 21] },
    }),
  ).rejects.toThrow(/range/);
  expect(await store.list()).toEqual(before);
  await store.close();
});
it("round trips the separate portable configuration and refuses unsupported or invalid content", () => {
  const resource = { id: configuration.id, revision: 7, configuration };
  expect(
    importDeviceConfiguration(exportDeviceConfiguration(resource)),
  ).toEqual(resource);
  expect(() =>
    importDeviceConfiguration(
      JSON.stringify({
        format: "scoremap-device-configuration",
        version: 2,
        resource,
      }),
    ),
  ).toThrow(/Unsupported/);
  expect(() =>
    deviceConfiguration({ ...configuration, range: [-1, 128] }),
  ).toThrow(/range/);
  expect(() =>
    deviceConfiguration({ ...configuration, unexpected: true }),
  ).toThrow(/unexpected/);
});
