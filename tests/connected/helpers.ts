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
export const applicationOrigin = target.origin;
const libraryRateLimit = new WeakMap<Page, number>();
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
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    const libraryRead =
      pathname === "/api/library" && response.request().method() === "GET";
    if (libraryRead) libraryRateLimit.delete(page);
    if (response.status() === 429) {
      const header = response.headers()["retry-after"] ?? "";
      const seconds = Number(header);
      if (libraryRead && /^\d+$/.test(header) && seconds >= 1 && seconds <= 60)
        libraryRateLimit.set(page, Date.now() + seconds * 1000);
      console.warn(
        `[synthetic-rate-limit] ${pathname} retryAfter=${header || "unavailable"}`,
      );
    }
  });
  await signIn(page, username);
  return { context, page };
}
let previousLoginAt = 0;
export async function signIn(page: Page, username: string) {
  await expect
    .poll(
      async () => {
        try {
          return (
            await page.request.get(new URL("/health/ready", target).href, {
              timeout: 2000,
            })
          ).status();
        } catch {
          return 0;
        }
      },
      {
        timeout: 30000,
        message:
          "Wait for the selected synthetic application readiness before browser login",
      },
    )
    .toBe(200);
  const wait = Math.max(0, previousLoginAt + 5000 - Date.now());
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
  const retry = page.getByRole("button", {
    name: "Try opening again",
    exact: true,
  });
  const outcome = await Promise.race([
    toggle.waitFor({ state: "attached" }).then(() => "ready" as const),
    retry.waitFor({ state: "attached" }).then(() => "failed" as const),
  ]);
  if (outcome === "failed") {
    const until = libraryRateLimit.get(page);
    if (until === undefined)
      throw new Error("Library load failed without a retryable rate limit.");
    libraryRateLimit.delete(page);
    const remaining = until - Date.now();
    if (remaining > 0)
      await new Promise((resolve) => setTimeout(resolve, remaining + 100));
    const loaded = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/library" &&
        response.request().method() === "GET",
    );
    await retry.click();
    if ((await loaded).status() !== 200)
      throw new Error("Library read failed after its one rate-limit retry.");
    await toggle.waitFor({ state: "attached" });
  }
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
}
