import { test, expect } from "@playwright/test";
import { login, openSong, saveView, syntheticSong } from "./helpers";

test("a rate-limited initial library read waits and uses the explicit recovery control", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const song = syntheticSong();
    await saveView(owner.page, (library) => {
      library.songs.push(song);
    });
    let reads = 0;
    await owner.page.route("**/api/library", (route) => {
      if (route.request().method() !== "GET") return route.continue();
      reads++;
      return reads === 1
        ? route.fulfill({
            status: 429,
            headers: { "Retry-After": "1" },
            body: "",
          })
        : route.continue();
    });
    await owner.page.reload();
    await openSong(owner.page, song.title);
    await expect(
      owner.page.getByRole("heading", { name: song.title, exact: true }),
    ).toBeVisible();
    expect(reads).toBe(2);
  } finally {
    await owner.context.close();
  }
});

test("other library errors and rate-limited writes are not retried", async ({
  browser,
}) => {
  const owner = await login(browser, "owner-a");
  try {
    const song = syntheticSong();
    await saveView(owner.page, (library) => {
      library.songs.push(song);
    });
    let reads = 0,
      writes = 0;
    await owner.page.route("**/api/library", (route) => {
      if (route.request().method() === "GET") {
        reads++;
        return route.fulfill({ status: 503, body: "" });
      }
      if (route.request().method() === "PUT") {
        writes++;
        return route.fulfill({
          status: 429,
          headers: { "Retry-After": "1" },
          body: "",
        });
      }
      return route.continue();
    });
    await owner.page.reload();
    await expect(openSong(owner.page, song.title)).rejects.toThrow(
      "without a retryable rate limit",
    );
    expect(reads).toBe(1);
    const status = await owner.page.evaluate(
      async () => (await fetch("/api/library", { method: "PUT" })).status,
    );
    expect(status).toBe(429);
    expect(writes).toBe(1);
  } finally {
    await owner.context.close();
  }
});
