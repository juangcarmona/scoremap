import { test, expect } from "@playwright/test";
import { api, login, openSong, saveView } from "./helpers";
import { richRevision } from "./canonical-fixtures";
import { validateLibrary } from "../../src/features/library/domain";
import type { RichSong } from "../../src/features/library/score";

test("SB-NOTATION: real dual Latin-primary preference changes D-flat3 F3 A-flat3 across editor, theory, saved voicing and consultation without a musical revision", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a"),
    other = await login(browser, "owner-b");
  const { song } = await richRevision(owner.page, 1);
  const pitches = [
    { spelling: "Db", octave: 3, midi: 49 },
    { spelling: "F", octave: 3, midi: 53 },
    { spelling: "Ab", octave: 3, midi: 56 },
  ];
  const before = await saveView(owner.page, (library) => {
    const rich = library.songs.find(
      (value) => value.id === song.id,
    ) as RichSong;
    rich.sections[0]!.chords[0]!.root = "Db";
    rich.sections[0]!.chords[0]!.quality = "major";
    rich.arrangements[0]!.parts[0]!.events =
      rich.arrangements[0]!.parts[0]!.events.slice(0, 1);
    rich.arrangements[0]!.parts[0]!.events[0]!.pitch = pitches[0]!;
    rich.arrangements[0]!.parts[1]!.events.forEach((event, index) => {
      event.pitch = pitches[index + 1]!;
    });
    rich.arrangements[0]!.bindings[1]!.range = [48, 108];
    rich.arrangements[1]!.voicings.forEach((value) => {
      value.custom = true;
    });
    validateLibrary(library);
  });
  const presetId = crypto.randomUUID();
  expect(
    (
      await api(owner.page, "/api/voicing-presets", "POST", {
        operation: "save",
        id: presetId,
        expectedRevision: 0,
        commandId: crypto.randomUUID(),
        mode: "edit",
        content: {
          id: presetId,
          name: "Canonical D-flat voicing",
          harmony: { root: "Db", quality: "major" },
          pitches,
          custom: false,
        },
      })
    ).status(),
  ).toBe(200);
  for (const [page, mode] of [
    [owner.page, "anglo"],
    [other.page, "latin"],
  ] as const) {
    const preference = await (
      await api(page, "/api/preferences/notation")
    ).json();
    expect(
      (
        await api(page, "/api/preferences/notation", "PUT", {
          mode,
          primary: mode,
          expectedRevision: preference.revision,
          commandId: crypto.randomUUID(),
        })
      ).status(),
    ).toBe(200);
  }
  const otherPreference = await (
    await api(other.page, "/api/preferences/notation")
  ).json();
  await owner.page.evaluate(() =>
    localStorage.setItem(
      "scoremap-notation",
      JSON.stringify({ mode: "latin", primary: "latin" }),
    ),
  );
  const anonymous = await owner.page.evaluate(() =>
    localStorage.getItem("scoremap-notation"),
  );
  await owner.page.reload();
  await openSong(owner.page, song.title);
  const choice = owner.page.getByLabel("Note names", { exact: true });
  await expect(choice).toHaveValue("anglo");
  await choice.selectOption("dual-latin");
  await expect(
    owner.page.getByText("Note names saved to your account", { exact: true }),
  ).toBeVisible();
  await expect(
    owner.page.getByRole("button", {
      name: "Verse chord 1: Re♭ (D♭)",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    owner.page.getByText("Theoretical notes: Re♭ (D♭) · Fa (F) · La♭ (A♭)", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    owner.page
      .getByLabel("Root for Verse", { exact: true })
      .getByRole("option", { name: "Re♭ (D♭)", exact: true }),
  ).toHaveAttribute("value", "Db");
  await owner.page
    .getByLabel("Active performed part", { exact: true })
    .selectOption(
      (
        before.library.songs.find(
          (value: RichSong) => value.id === song.id,
        ) as RichSong
      ).arrangements[0]!.parts[1]!.id,
    );
  await owner.page
    .getByRole("region", { name: "Arrangement workspace", exact: true })
    .getByText("Your private reusable voicings", { exact: true })
    .click();
  await expect(
    owner.page
      .getByRole("region", { name: "Arrangement workspace", exact: true })
      .getByText("Re♭ (D♭) · Re♭3 (D♭3) · Fa3 (F3) · La♭3 (A♭3)", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  for (const label of ["Re♭3 (D♭3)", "Fa3 (F3)", "La♭3 (A♭3)"])
    await expect(
      owner.page
        .getByRole("button", {
          name: label + " · performed · theoretical tone",
          exact: true,
        })
        .first(),
    ).toBeVisible();
  await owner.page
    .getByRole("button", { name: "Enter performance", exact: true })
    .click();
  await expect(choice).toHaveValue("dual-latin");
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  await owner.page.reload();
  await openSong(owner.page, song.title);
  await expect(
    owner.page.getByLabel("Note names", { exact: true }),
  ).toHaveValue("dual-latin");
  expect(await (await api(owner.page, "/api/library")).json()).toEqual(before);
  expect(
    await (await api(other.page, "/api/preferences/notation")).json(),
  ).toEqual(otherPreference);
  expect(
    await owner.page.evaluate(() => localStorage.getItem("scoremap-notation")),
  ).toBe(anonymous);
  await owner.context.close();
  await other.context.close();
});
