import { expect, type Page, type Browser } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Library, Song } from "../../src/features/library/domain";
const target = new URL(
  process.env.SCOREMAP_TEST_ORIGIN ?? "http://localhost:5280",
);
if (["5380", "5381"].includes(target.port))
  throw new Error(
    "Synthetic connected fixtures must not target the real manual-trial ports.",
  );
export const fixture = JSON.parse(
  await readFile(
    process.env.SCOREMAP_TEST_USERS ?? "config/development-users.example.json",
    "utf8",
  ),
) as {
  realm: string;
  users: {
    username: string;
    id: string;
    email: string;
    credentials: { value: string }[];
  }[];
};
export async function login(
  browser: Browser,
  username: string,
  options: Parameters<Browser["newContext"]>[0] = {},
) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await signIn(page, username);
  return { context, page };
}
let previousLoginAt = 0;
export async function signIn(page: Page, username: string) {
  const wait = Math.max(0, previousLoginAt + 2100 - Date.now());
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  previousLoginAt = Date.now();
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  const user = fixture.users.find((u) => u.username === username)!;
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(user.credentials[0]!.value);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  if (
    await page
      .getByRole("heading", { name: "Update Account Information" })
      .isVisible()
  ) {
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(user.email);
    await page.getByRole("button", { name: "Submit", exact: true }).click();
  }
  await expect(page.getByText(`${username} · Private library`)).toBeVisible();
}
export async function api(
  page: Page,
  path: string,
  method = "GET",
  body?: unknown,
) {
  const identity = (await (await page.request.get("/auth/session")).json()) as {
    csrf: string;
  };
  return page.request.fetch(path, {
    method,
    headers: { "X-ScoreMap-CSRF": identity.csrf },
    ...(body ? { data: body } : {}),
  });
}
export async function saveView(page: Page, change: (library: Library) => void) {
  const view = await (await api(page, "/api/library")).json();
  const library = structuredClone(view.library) as Library;
  change(library);
  const response = await api(page, "/api/library", "PUT", {
    library,
    expectedRevision: view.library.revision,
    versions: view.versions,
    commandId: crypto.randomUUID(),
    mode: "edit",
  });
  expect(response.status()).toBe(200);
  return response.json();
}
export function syntheticSong(): Song {
  const id = crypto.randomUUID();
  return {
    id,
    title: `Synthetic recovery ${id.slice(0, 8)}`,
    artist: "Synthetic fixture",
    notes: "Original retained cue",
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Bridge",
        repeat: 3,
        notes: "Quiet entry",
        chords: [{ root: "Db", quality: "minor" }],
      },
    ],
    references: [
      {
        id: crypto.randomUUID(),
        title: "Synthetic reference",
        url: "https://example.com/score",
      },
    ],
  };
}
export async function openSong(page: Page, title: string) {
  const toggle = page.getByRole("button", {
    name: "Library",
    exact: true,
    includeHidden: true,
  });
  await toggle.waitFor({ state: "attached" });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
}
