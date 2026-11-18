import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { login, api, saveView, openSong } from "./helpers";
import { uniqueRichFixture } from "./rich-fixtures";
import type { RichSong } from "../../src/features/library/score";
async function fixture() {
  return uniqueRichFixture(
    JSON.parse(
      await readFile("tests/fixtures/arrangement-navigation.json", "utf8"),
    ) as RichSong,
  );
}
async function anglo(page: Page) {
  const value = await (await api(page, "/api/preferences/notation")).json();
  if (value.mode !== "anglo")
    expect(
      (
        await api(page, "/api/preferences/notation", "PUT", {
          mode: "anglo",
          primary: "anglo",
          expectedRevision: value.revision,
          commandId: crypto.randomUUID(),
        })
      ).status(),
    ).toBe(200);
}
const pitches = (page: Page, name: string) =>
  page
    .getByRole("article", { name: `Keyboard ${name}`, exact: true })
    .locator('.performed-key[data-performed="true"]');
test("SB-NAVIGATION: one private performance context synchronizes three independently ranged keyboards and clears the silent part", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a", {
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  await anglo(owner.page);
  const { song, ids } = await fixture();
  await saveView(owner.page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await owner.page
    .getByLabel("Occurrence of Verse", { exact: true })
    .selectOption("2");
  for (const [name, octave] of [
    ["Low keyboard", 2],
    ["High keyboard", 4],
    ["Pad keyboard", 3],
  ] as const)
    await owner.page
      .getByLabel(`First visible octave for keyboard ${name}`, { exact: true })
      .selectOption(String(octave));
  const before = await (await api(owner.page, "/api/library")).json();
  await expect(pitches(owner.page, "Low keyboard")).toHaveCount(2);
  await expect(pitches(owner.page, "High keyboard")).toHaveCount(2);
  await expect(pitches(owner.page, "Pad keyboard")).toHaveCount(1);
  const context = owner.page.getByRole("region", {
    name: "Synchronized keyboard views",
    exact: true,
  });
  await expect(context).toHaveAttribute("data-occurrence", "2");
  await owner.page
    .getByLabel("Active performed harmonic event", { exact: true })
    .selectOption(ids.get("h2")!);
  await expect(context).toHaveAttribute("data-measure-id", ids.get("m2")!);
  await expect(context).toHaveAttribute(
    "data-harmonic-event-id",
    ids.get("h2")!,
  );
  await expect(pitches(owner.page, "Pad keyboard")).toHaveCount(0);
  for (const [name, expected] of [
    ["Low keyboard", [36, 43]],
    ["High keyboard", [64, 71]],
  ] as const)
    expect(
      await pitches(owner.page, name).evaluateAll((nodes) =>
        nodes.map((node) => Number(node.getAttribute("data-midi"))),
      ),
    ).toEqual(expected);
  await expect(
    owner.page.getByRole("article", {
      name: "Keyboard Pad keyboard",
      exact: true,
    }),
  ).toContainText("Silent at this event");
  const contexts = await owner.page
    .locator(".keyboard-view")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-context")),
    );
  expect(new Set(contexts).size).toBe(1);
  expect(contexts[0]).toContain("occurrence 2 of 2 · measure 2");
  for (const [name, octave] of [
    ["Low keyboard", 2],
    ["High keyboard", 4],
    ["Pad keyboard", 3],
  ] as const)
    await expect(
      owner.page.getByLabel(`First visible octave for keyboard ${name}`, {
        exact: true,
      }),
    ).toHaveValue(String(octave));
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.page
    .getByLabel("Active performed harmonic event", { exact: true })
    .selectOption(ids.get("held")!);
  await expect(pitches(owner.page, "Low keyboard")).toHaveCount(2);
  await expect(pitches(owner.page, "High keyboard")).toHaveCount(2);
  await expect(pitches(owner.page, "Pad keyboard")).toHaveCount(0);
  await owner.page
    .getByLabel("First visible octave for keyboard Low keyboard", {
      exact: true,
    })
    .selectOption("3");
  await expect(
    owner.page
      .getByRole("article", { name: "Keyboard Low keyboard", exact: true })
      .getByRole("status"),
  ).toContainText("Outside this view: C2 · G2");
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(
    (
      await api(owner.page, "/api/library", "PUT", {
        library: before.library,
        expectedRevision: before.library.revision,
        versions: before.versions,
        commandId: crypto.randomUUID(),
        mode: "performance",
      })
    ).status(),
  ).toBe(400);
  await owner.page.setViewportSize({ width: 390, height: 844 });
  await owner.page.addStyleTag({ content: "html:root {font-size:200%}" });
  expect(
    await owner.page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page: owner.page }).analyze()).violations,
  ).toEqual([]);
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.page.screenshot({
    path: "test-results/connected/synchronized-keyboards-phone.png",
    fullPage: true,
  });
  await owner.context.close();
});

test("SB-PART-ISOLATION: one private editor command adds P4 and K4 binding while preserving three prior parts, independent Q and shared form", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  await anglo(owner.page);
  const { song, ids } = await fixture();
  const r = song.arrangements[0]!;
  const k4 = {
    id: crypto.randomUUID(),
    name: "Fourth keyboard",
    instrument: "keyboard",
    range: [21, 108] as [number, number],
  };
  r.devices.push(k4);
  const qp = crypto.randomUUID(),
    qn = crypto.randomUUID(),
    qv = crypto.randomUUID(),
    qk = crypto.randomUUID();
  song.arrangements.push({
    id: crypto.randomUUID(),
    name: "Independent Q",
    parts: [
      {
        id: qp,
        name: "Q part",
        role: "",
        events: [
          {
            id: qn,
            measureId: ids.get("m1")!,
            start: { n: 0, d: 1 },
            duration: { n: 1, d: 1 },
            pitch: { spelling: "C", octave: 3, midi: 48 },
            voicingId: qv,
          },
        ],
      },
    ],
    devices: [
      { id: qk, name: "Q keyboard", instrument: "keyboard", range: [0, 127] },
    ],
    bindings: [
      {
        id: crypto.randomUUID(),
        partId: qp,
        deviceId: qk,
        range: [0, 127],
        sound: "Q sound",
      },
    ],
    voicings: [
      { id: qv, name: "Q voicing", harmonyId: ids.get("h1")!, custom: false },
    ],
  });
  await saveView(owner.page, (library) => {
    library.schemaVersion = 2;
    library.songs.push(song);
  });
  const presetId = crypto.randomUUID();
  const preset = {
    id: presetId,
    name: `Fourth supplied ${presetId.slice(0, 8)}`,
    harmony: { root: "C", quality: "major-seventh" },
    pitches: [{ spelling: "C", octave: 5, midi: 72 }],
    custom: false,
  };
  expect(
    (
      await api(owner.page, "/api/voicing-presets", "POST", {
        operation: "save",
        id: presetId,
        expectedRevision: 0,
        commandId: crypto.randomUUID(),
        mode: "edit",
        content: preset,
      })
    ).status(),
  ).toBe(200);
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await owner.page
    .getByText("Configure arrangement, parts & keyboards", { exact: true })
    .click();
  const form = owner.page.getByRole("form", {
    name: "Add performed part",
    exact: true,
  });
  await form.getByLabel("Part name", { exact: true }).fill("P4");
  await form.getByLabel("Musical role", { exact: true }).fill("strings");
  await form
    .getByLabel("Initial reusable voicing", { exact: true })
    .selectOption(presetId);
  await form
    .getByLabel("Initial keyboard assignment", { exact: true })
    .selectOption(k4.id);
  await form.getByLabel("Sound · optional", { exact: true }).fill("Strings");
  await form.getByLabel("Layer · optional", { exact: true }).fill("Fourth pad");
  const before = await (await api(owner.page, "/api/library")).json();
  const personal = await (await api(owner.page, "/api/voicing-presets")).json();
  const prior = before.library.songs.find(
    (value: RichSong) => value.id === song.id,
  ) as RichSong;
  await form
    .getByRole("button", { name: "Add part and assignment", exact: true })
    .click();
  await expect(owner.page.locator(".save-state")).toHaveText(
    "Saved to your private library",
  );
  const after = await (await api(owner.page, "/api/library")).json();
  const current = after.library.songs.find(
    (value: RichSong) => value.id === song.id,
  ) as RichSong;
  const result = current.arrangements[0]!;
  expect(result.parts).toHaveLength(4);
  expect(result.devices).toEqual(prior.arrangements[0]!.devices);
  expect(result.parts.slice(0, 3)).toEqual(prior.arrangements[0]!.parts);
  expect(result.bindings.slice(0, 3)).toEqual(prior.arrangements[0]!.bindings);
  expect(result.voicings.slice(0, 2)).toEqual(prior.arrangements[0]!.voicings);
  expect(current.arrangements[1]).toEqual(prior.arrangements[1]);
  expect(current.sections).toEqual(prior.sections);
  const added = result.parts[3]!;
  expect(added.name).toBe("P4");
  expect(added.role).toBe("strings");
  expect(added.hand).toBeUndefined();
  expect(added.events).toHaveLength(1);
  expect(added.events[0]).toMatchObject({
    measureId: ids.get("m1"),
    start: { n: 0, d: 1 },
    duration: { n: 1, d: 1 },
    pitch: { spelling: "C", octave: 5, midi: 72 },
  });
  const oldIds = new Set(
    prior.arrangements.flatMap((arrangement) =>
      arrangement.parts.flatMap((part) => part.events.map((event) => event.id)),
    ),
  );
  expect(oldIds.has(added.events[0]!.id)).toBe(false);
  expect(result.bindings[3]).toMatchObject({
    partId: added.id,
    deviceId: k4.id,
    range: [21, 108],
    sound: "Strings",
    layer: "Fourth pad",
  });
  expect(after.versions[song.id]).toBe(before.versions[song.id] + 1);
  expect(after.library.revision).toBe(before.library.revision + 1);
  expect(
    after.library.songs.filter((value: RichSong) => value.id !== song.id),
  ).toEqual(
    before.library.songs.filter((value: RichSong) => value.id !== song.id),
  );
  expect(await (await api(owner.page, "/api/voicing-presets")).json()).toEqual(
    personal,
  );
  const history = await (
    await api(owner.page, `/api/songs/${song.id}/history`)
  ).json();
  expect(history[1].content).toEqual(prior);
  await owner.context.close();
});
