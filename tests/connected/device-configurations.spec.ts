import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { login, api, saveView, openSong } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import { copyArrangementIdentities } from "../../src/features/library/identityCopy";
import type { RichSong } from "../../src/features/library/score";
import type { SavedDeviceConfiguration } from "../../src/features/library/deviceConfigurations";

test("reusable keyboard configurations protect a lost save, copy independently into one arrangement and preserve song content through owner-scoped edit, export, removal and import", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a", {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const other = await login(browser, "owner-b");
  const { song } = uniqueRichFixture(
    JSON.parse(
      await readFile("tests/fixtures/arrangement-navigation.json", "utf8"),
    ) as RichSong,
  );
  const identities = new Map<string, string>();
  const independent = copyArrangementIdentities(song.arrangements[0]!, (id) => {
    if (!identities.has(id)) identities.set(id, crypto.randomUUID());
    return identities.get(id)!;
  });
  independent.name = "Independent Q";
  song.arrangements.push(independent);
  await saveView(owner.page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  const before = await (await api(owner.page, "/api/library")).json();
  const originalResources = (await (
    await api(owner.page, "/api/device-configurations")
  ).json()) as SavedDeviceConfiguration[];
  const anonymous = {
    id: crypto.randomUUID(),
    revision: 1,
    configuration: {
      id: "anonymous-original",
      name: "Anonymous resource must remain separate",
      instrument: "keyboard",
      range: [21, 108],
    },
  };
  anonymous.configuration.id = anonymous.id;
  await owner.page.evaluate(async (resource) => {
    const open = indexedDB.open("scoremap-device-configurations", 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore("configurations");
      open.result.createObjectStore("receipts");
    };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction("configurations", "readwrite");
    tx.objectStore("configurations").put(resource, resource.id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, anonymous);
  await owner.page.reload();
  let footer = owner.page.locator(".library-footer");
  await owner.page
    .getByRole("button", { name: "Library", exact: true })
    .click();
  await footer
    .getByText("Your private reusable keyboard configurations", { exact: true })
    .click();
  await expect(
    footer.getByText(anonymous.configuration.name, { exact: true }),
  ).toHaveCount(0);
  const name = `Synthetic reusable keyboard ${crypto.randomUUID()}`;
  let originalRequest: Record<string, unknown> = {};
  await owner.page.route("**/api/device-configurations", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    originalRequest = route.request().postDataJSON();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort("failed");
  });
  const form = footer.getByRole("form", {
    name: "Save reusable keyboard configuration",
    exact: true,
  });
  await form.getByLabel("Configuration name", { exact: true }).fill(name);
  await form.getByLabel("Lowest note", { exact: true }).selectOption("21");
  await form.getByLabel("Highest note", { exact: true }).selectOption("108");
  await form
    .getByRole("button", { name: "Save reusable configuration", exact: true })
    .click();
  await expect(footer.getByRole("alert")).toBeVisible();
  const recovery = owner.page.getByRole("region", {
    name: "Protected personal changes",
  });
  await expect(recovery).toContainText("Keyboard configuration");
  const saved = (
    (await (
      await api(owner.page, "/api/device-configurations")
    ).json()) as SavedDeviceConfiguration[]
  ).find((resource) => resource.configuration?.name === name)!;
  expect(saved.revision).toBe(1);
  expect(saved.configuration?.range).toEqual([21, 108]);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  const pending = await owner.page.evaluate(async () => {
    const open = indexedDB.open("scoremap-protected-personal", 1);
    const db = await new Promise<IDBDatabase>((resolve) => {
      open.onsuccess = () => resolve(open.result);
    });
    const all = db.transaction("pending").objectStore("pending").getAll();
    const records = await new Promise<{ cipher: ArrayBuffer }[]>((resolve) => {
      all.onsuccess = () => resolve(all.result);
    });
    db.close();
    return records.map((record) => ({
      encrypted: record.cipher instanceof ArrayBuffer,
      serialized: JSON.stringify(record),
    }));
  });
  expect(pending).toHaveLength(1);
  expect(pending[0]!.encrypted).toBe(true);
  expect(pending[0]!.serialized).not.toContain(name);
  await owner.page.unroute("**/api/device-configurations");
  await owner.page.reload();
  await recovery
    .getByRole("button", { name: "Review personal draft 1", exact: true })
    .click();
  await recovery
    .getByRole("button", {
      name: "Retry original personal change and reopen",
      exact: true,
    })
    .click();
  await expect(recovery).toHaveCount(0);
  expect(
    (
      await api(
        owner.page,
        "/api/device-configurations",
        "POST",
        originalRequest,
      )
    ).status(),
  ).toBe(200);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await openSong(owner.page, song.title);
  await owner.page
    .getByText("Configure arrangement, parts & keyboards", { exact: true })
    .click();
  await owner.page
    .getByLabel("Reusable keyboard configuration", { exact: true })
    .selectOption(saved.id);
  await owner.page
    .getByRole("button", {
      name: "Copy saved configuration into this arrangement",
      exact: true,
    })
    .click();
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Saved to your private library",
  );
  const copied = await (await api(owner.page, "/api/library")).json();
  const actual = copied.library.songs.find(
    (candidate: RichSong) => candidate.id === song.id,
  ) as RichSong;
  const added = actual.arrangements[0]!.devices.find(
    (device) => device.name === name,
  )!;
  expect(added.id).not.toBe(saved.id);
  expect(added).toEqual({ ...saved.configuration, id: added.id });
  const expected = structuredClone(before.library);
  expected.revision++;
  expected.songs
    .find((candidate: RichSong) => candidate.id === song.id)
    .arrangements[0].devices.push(added);
  expect(copied.library).toEqual(expected);
  expect(
    (
      (await (
        await api(other.page, "/api/device-configurations")
      ).json()) as SavedDeviceConfiguration[]
    ).some((resource) => resource.id === saved.id),
  ).toBe(false);
  expect(
    (
      await api(other.page, "/api/device-configurations", "POST", {
        ...originalRequest,
        expectedRevision: 1,
        commandId: crypto.randomUUID(),
      })
    ).status(),
  ).toBe(409);
  for (const change of [
    { mode: "performance" },
    { content: { ...saved.configuration, range: [108, 21] } },
  ])
    expect(
      (
        await api(owner.page, "/api/device-configurations", "POST", {
          ...originalRequest,
          expectedRevision: 1,
          commandId: crypto.randomUUID(),
          ...change,
        })
      ).status(),
    ).toBe(400);
  expect(
    (
      await owner.page.request.post("/api/device-configurations", {
        data: originalRequest,
      })
    ).status(),
  ).toBe(400);
  footer = owner.page.locator(".library-footer");
  await owner.page
    .getByRole("button", { name: "Library", exact: true })
    .click();
  await footer
    .getByText("Your private reusable keyboard configurations", { exact: true })
    .click();
  const [download] = await Promise.all([
    owner.page.waitForEvent("download"),
    footer
      .getByRole("button", {
        name: `Export configuration ${name}`,
        exact: true,
      })
      .click(),
  ]);
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.resource).toEqual(saved);
  await footer.getByText(`Edit configuration ${name}`, { exact: true }).click();
  const editing = footer.getByRole("form", {
    name: `Edit reusable configuration ${name}`,
    exact: true,
  });
  await editing.getByLabel("Lowest note", { exact: true }).selectOption("36");
  await editing.getByLabel("Highest note", { exact: true }).selectOption("96");
  await editing
    .getByRole("button", { name: "Save configuration changes", exact: true })
    .click();
  await expect(
    footer.getByText(
      "Reusable configuration updated. Existing song copies are unchanged.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    (
      (await (
        await api(owner.page, "/api/device-configurations")
      ).json()) as SavedDeviceConfiguration[]
    ).find((resource) => resource.id === saved.id),
  ).toEqual({
    ...saved,
    revision: 2,
    configuration: { ...saved.configuration, range: [36, 96] },
  });
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(copied);
  expect(
    (
      await api(owner.page, "/api/device-configurations", "POST", {
        ...originalRequest,
        commandId: crypto.randomUUID(),
      })
    ).status(),
  ).toBe(409);
  owner.page.once("dialog", (dialog) => dialog.accept());
  await footer
    .getByRole("button", {
      name: `Remove reusable configuration ${name}`,
      exact: true,
    })
    .click();
  await expect(
    footer.getByText(
      "Reusable configuration removed. Song copies are unchanged.",
      { exact: true },
    ),
  ).toBeVisible();
  owner.page.once("dialog", (dialog) => dialog.accept());
  await footer
    .getByLabel("Reusable configuration import file", { exact: true })
    .setInputFiles({
      name: "synthetic-configuration.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exported)),
    });
  await expect(
    footer.getByText(
      "Configuration copy import finished. Existing resources and the source file are kept.",
      { exact: true },
    ),
  ).toBeVisible();
  const final = (await (
    await api(owner.page, "/api/device-configurations")
  ).json()) as SavedDeviceConfiguration[];
  const imported = final.filter(
    (resource) => resource.configuration?.name === name,
  );
  expect(imported).toHaveLength(1);
  expect(imported[0]!.id).not.toBe(saved.id);
  expect(imported[0]!.revision).toBe(1);
  expect(imported[0]!.configuration).toEqual({
    ...saved.configuration,
    id: imported[0]!.id,
  });
  for (const resource of originalResources)
    expect(final.find((candidate) => candidate.id === resource.id)).toEqual(
      resource,
    );
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(copied);
  expect(
    await owner.page.evaluate(async (id) => {
      const open = indexedDB.open("scoremap-device-configurations", 1);
      const db = await new Promise<IDBDatabase>((resolve) => {
        open.onsuccess = () => resolve(open.result);
      });
      const read = db
        .transaction("configurations")
        .objectStore("configurations")
        .get(id);
      const result = await new Promise((resolve) => {
        read.onsuccess = () => resolve(read.result);
      });
      db.close();
      return result;
    }, anonymous.id),
  ).toEqual(anonymous);
  expect(
    await owner.page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page: owner.page }).analyze()).violations,
  ).toEqual([]);
  await Promise.all([owner.context.close(), other.context.close()]);
});
