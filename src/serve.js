import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { extname } from "node:path";
import { logger } from "./logger.js";
import { debugLog } from "./debug.js";
import { fileExists } from "./utils.js";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Mimes For.
 * @param {*} filePath
 * @returns {*}
 */
function mimeFor(filePath) {
  return MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
}

/**
 * Reads Index File.
 * @param {*} rootDir
 * @returns {Promise<*>}
 */
async function readIndexFile(rootDir) {
  const candidates = [
    path.join(rootDir, "index.html"),
    path.join(rootDir, "app", "src", "main", "assets", "www", "index.html"),
    path.join(rootDir, "public", "index.html"),
  ];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}

/**
 * Injects Live Reload.
 * @param {*} html
 * @param {*} clientPath
 * @returns {*}
 */
function injectLiveReload(html, clientPath = "/__japkgen_live_reload.js") {
  if (html.includes(clientPath)) return html;
  return html.replace(
    /<\/body>/i,
    `<script src="${clientPath}"></script></body>`
  );
}

/**
 * Serves Project.
 * @param {*} projectDirArg
 * @param {Object} param
 * @returns {Promise<Object>}
 */
export async function serveProject(projectDirArg = process.cwd(), { port = 4173, watch = true } = {}) {
  const projectDir = path.resolve(projectDirArg);
  let rootDir = projectDir;
  const preferredIndex = await readIndexFile(projectDir);
  if (preferredIndex) rootDir = path.dirname(preferredIndex);

  const clients = new Set();
  let version = 0;

  const server = http.createServer(/**
   * Functions a value.
   * @param {*} req
   * @param {*} res
   * @returns {Promise<void>}
   */
  async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/__japkgen_events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.write(`event: hello\ndata: ready\n\n`);
      clients.add(res);
      req.on("close", /**
       * Functions a value.
       * @returns {*}
       */
      () => clients.delete(res));
      return;
    }

    if (url.pathname === "/__japkgen_live_reload.js") {
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(`
        const source = new EventSource('/__japkgen_events');
        source.addEventListener('reload', () => location.reload());
      `);
      return;
    }

    let filePath = path.join(rootDir, decodeURIComponent(url.pathname));
    if (url.pathname === "/") {
      const index = await readIndexFile(rootDir);
      filePath = index || path.join(rootDir, "index.html");
    }

    try {
      let stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        stat = await fs.stat(filePath);
      }
      let body = await fs.readFile(filePath);
      const type = mimeFor(filePath);
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });

      if (type.startsWith("text/html")) {
        body = Buffer.from(injectLiveReload(body.toString("utf8")));
      }
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  });

  await new Promise(/**
   * Functions a value.
   * @param {*} resolve
   * @returns {*}
   */
  resolve => server.listen(port, resolve));
  logger.title("JAPKGEN Serve");
  logger.success(`Server aktif di http://localhost:${port}`);
  logger.info(`Serving: ${rootDir}`);
  debugLog("serve", "Serving root", rootDir);

  let watcher = null;
  if (watch) {
    try {
      watcher = await fs.watch(projectDir, { recursive: true }, /**
       * Functions a value.
       */
      () => {
        version++;
        for (const res of clients) {
          res.write(`event: reload\ndata: ${version}\n\n`);
        }
        logger.dim("File berubah, browser akan reload.");
      });
      logger.note("Live reload aktif.");
    } catch {
      logger.warn(
        "File watcher tidak tersedia di platform ini. Serve tetap jalan tanpa live reload."
      );
    }
  }

  return {
    /**
     * Closes a value.
     * @returns {Promise<void>}
     */
    close: async () => {
      watcher?.close?.();
      for (const res of clients) {
        try {
          res.end();
        } catch {}
      }
      await new Promise(/**
       * Functions a value.
       * @param {*} resolve
       * @returns {*}
       */
      resolve => server.close(resolve));
    },
    server,
    rootDir,
  };
}
