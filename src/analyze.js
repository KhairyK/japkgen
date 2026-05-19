import path from "node:path";
import { listZipEntriesWithUnzip, humanBytes, fileExists } from "./utils.js";
import { logger } from "./logger.js";

/**
 * Parses Entry Line.
 * @param {*} line
 * @returns {*}
 */
function parseEntryLine(line) {
  const trimmed = String(line).trim();
  if (!trimmed) return null;

  const tsv = trimmed.match(/^(\d+)\t(.+)$/);
  if (tsv) {
    return { size: Number(tsv[1]), name: tsv[2].trim() };
  }

  const unzip = trimmed.match(/^\s*(\d+)\s+([\d-]+\s+[\d:]+)\s+(.+)$/);
  if (unzip) {
    return { size: Number(unzip[1]), name: unzip[3].trim() };
  }

  return null;
}

/**
 * Parses Entry List.
 * @param {*} output
 * @returns {*}
 */
function parseEntryList(output) {
  const entries = [];
  for (const line of String(output).split(/\r?\n/)) {
    const entry = parseEntryLine(line);
    if (!entry || !entry.name || entry.name.endsWith("/")) continue;
    entries.push(entry);
  }
  return entries;
}

/**
 * Summarizes a value.
 * @param {*} entries
 * @returns {Object}
 */
function summarize(entries) {
  const total = entries.reduce(/**
   * Functions a value.
   * @param {*} sum
   * @param {*} e
   * @returns {number}
   */
  (sum, e) => sum + e.size, 0);
  const count = entries.length;
  const extMap = new Map();

  for (const e of entries) {
    const ext = path.extname(e.name).toLowerCase() || "(no ext)";
    extMap.set(ext, (extMap.get(ext) || 0) + e.size);
  }

  const top = [...entries].sort(/**
   * Functions a value.
   * @param {*} a
   * @param {*} b
   * @returns {number}
   */
  (a, b) => b.size - a.size).slice(0, 8);
  const hasManifest = entries.some(
    /**
     * Functions a value.
     * @param {*} e
     * @returns {*}
     */
    e => e.name === "AndroidManifest.xml" ||
    e.name.endsWith("/AndroidManifest.xml")
  );
  const dexCount = entries.filter(/**
   * Functions a value.
   * @param {*} e
   * @returns {*}
   */
  e => e.name.endsWith(".dex")).length;
  const nativeLibCount = entries.filter(
    /**
     * Functions a value.
     * @param {*} e
     * @returns {*}
     */
    e => e.name.startsWith("lib/") && e.name.endsWith(".so")
  ).length;

  return { total, count, extMap, top, hasManifest, dexCount, nativeLibCount };
}

/**
 * Analyzes Apk.
 * @param {*} apkPath
 * @returns {Promise<Object>}
 */
export async function analyzeApk(apkPath) {
  const resolved = path.resolve(apkPath);
  if (!(await fileExists(resolved))) {
    throw new Error(`APK not found: ${resolved}`);
  }

  const output = await listZipEntriesWithUnzip(resolved);
  const entries = parseEntryList(output);
  const summary = summarize(entries);

  logger.title("APK Analyzer");
  logger.bullet("File", resolved);
  logger.bullet("Entries", String(summary.count));
  logger.bullet("Total size", humanBytes(summary.total));
  logger.bullet(
    "AndroidManifest.xml",
    summary.hasManifest ? "found" : "missing"
  );
  logger.bullet("DEX files", String(summary.dexCount));
  logger.bullet("Native libs", String(summary.nativeLibCount));

  logger.section("Largest entries");
  for (const entry of summary.top) {
    logger.bullet(entry.name, humanBytes(entry.size));
  }

  logger.section("Size by extension");
  const sortedExt = [...summary.extMap.entries()]
    .sort(/**
   * Functions a value.
   * @param {*} a
   * @param {*} b
   * @returns {number}
   */
  (a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [ext, size] of sortedExt) {
    logger.bullet(ext, humanBytes(size));
  }

  return { resolved, entries, summary };
}
