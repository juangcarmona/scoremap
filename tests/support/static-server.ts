import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
export async function staticServer(initialRoot: string) {
  let root = initialRoot;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const route = decodeURIComponent(url.pathname);
      const file = path.resolve(
        root,
        "." + (route === "/" ? "/index.html" : route),
      );
      if (!file.startsWith(path.resolve(root) + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const bytes = await fs.readFile(file);
      const ext = path.extname(file);
      res.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".webmanifest": "application/manifest+json",
          } as Record<string, string>
        )[ext] ?? "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-store");
      res.end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No server address.");
  return {
    url: `http://127.0.0.1:${address.port}`,
    setRoot: (next: string) => {
      root = next;
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      ),
  };
}
