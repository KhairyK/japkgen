import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

/**
 * Normalizes Path Value.
 * @param {*} input
 * @returns {*}
 */
export function normalizePathValue(input = "") {
  return String(input)
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "");
}

/**
 * Tos Package Path.
 * @param {*} pkg
 * @returns {*}
 */
export function toPackagePath(pkg = "") {
  return normalizePathValue(String(pkg).trim().replaceAll(".", "/"));
}

/**
 * Tos Jni Package.
 * @param {*} pkg
 * @returns {*}
 */
export function toJniPackage(pkg = "") {
  return normalizePathValue(String(pkg).trim().replaceAll(".", "/")).replaceAll(
    "/",
    "_"
  );
}

/**
 * Applys Template.
 * @param {*} content
 * @param {*} vars
 * @returns {*}
 */
export function applyTemplate(content, vars) {
  return String(content).replace(/__([A-Z0-9_]+)__/g, /**
   * Functions a value.
   * @param {*} match
   * @param {*} key
   * @returns {*}
   */
  (match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key)
      ? String(vars[key])
      : match;
  });
}

/**
 * Parses List.
 * @param {*} input
 * @returns {*}
 */
export function parseList(input = "") {
  if (Array.isArray(input)) {
    return input.map(/**
     * Functions a value.
     * @param {*} v
     * @returns {*}
     */
    v => String(v).trim()).filter(Boolean);
  }
  return String(input)
    .split(",")
    .map(/**
   * Functions a value.
   * @param {*} v
   * @returns {*}
   */
  v => v.trim())
    .filter(Boolean);
}

/**
 * Parses Permissions.
 * @param {*} input
 * @returns {*}
 */
export function parsePermissions(input = "") {
  return parseList(input).map(/**
   * Functions a value.
   * @param {*} perm
   * @returns {*}
   */
  perm => perm.startsWith("android.permission.") ? perm : `android.permission.${perm}`
  );
}

/**
 * Uniqs a value.
 * @param {*} list
 * @returns {Array}
 */
export function uniq(list = []) {
  return [...new Set(list.filter(Boolean))];
}

/**
 * Checks whether Http Url.
 * @param {*} url
 * @returns {*}
 */
export function hasHttpUrl(url = "") {
  return /^https?:\/\//i.test(String(url).trim());
}

/**
 * Normalizes Boolean.
 * @param {*} value
 * @param {*} defaultValue
 * @returns {*}
 */
export function normalizeBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

/**
 * Writes File Ensured.
 * @param {*} filePath
 * @param {*} content
 * @returns {Promise<void>}
 */
export async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

/**
 * Reads Text.
 * @param {*} filePath
 * @returns {Promise<*>}
 */
export async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

/**
 * Files Exists.
 * @param {*} filePath
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Templates Exists.
 * @param {*} projectDir
 * @returns {Promise<*>}
 */
export async function templateExists(projectDir) {
  const gradlew =
    process.platform === "win32"
      ? path.join(projectDir, "gradlew.bat")
      : path.join(projectDir, "gradlew");
  const wrapperJar = path.join(
    projectDir,
    "gradle",
    "wrapper",
    "gradle-wrapper.jar"
  );
  const wrapperProps = path.join(
    projectDir,
    "gradle",
    "wrapper",
    "gradle-wrapper.properties"
  );
  return (
    (await fileExists(gradlew)) &&
    (await fileExists(wrapperJar)) &&
    (await fileExists(wrapperProps))
  );
}

/**
 * Gets Default Android Sdk Paths.
 * @returns {*}
 */
export function getDefaultAndroidSdkPaths() {
  const home = os.homedir();

  if (process.platform === "win32") {
    return [
      path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk"),
      path.join(
        process.env.USERPROFILE || home,
        "AppData",
        "Local",
        "Android",
        "Sdk"
      ),
    ].filter(Boolean);
  }

  if (process.platform === "darwin") {
    return [path.join(home, "Library", "Android", "sdk")];
  }

  return [path.join(home, "Android", "Sdk")];
}

/**
 * Files Exists Any.
 * @param {*} paths
 * @returns {Promise<*>}
 */
export async function fileExistsAny(paths = []) {
  for (const p of paths) {
    if (!p) continue;
    if (await fileExists(p)) return p;
  }
  return null;
}

/**
 * Normalizes Rel Path.
 * @param {*} input
 * @returns {*}
 */
export function normalizeRelPath(input = "") {
  return String(input).replaceAll("\\", "/");
}

/**
 * Finds Files.
 * @param {*} rootDir
 * @param {*} predicate
 * @param {*} options
 * @returns {Promise<*>}
 */
export async function findFiles(
  rootDir,
  predicate = /**
   * Functions a value.
   * @returns {boolean}
   */
  () => true,
  options = {}
) {
  const results = [];
  const maxDepth = options.maxDepth ?? 8;

  async function walk(current, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(rootDir, abs).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        await walk(abs, depth + 1);
      } else if (predicate(abs, rel, entry)) {
        results.push({ abs, rel });
      }
    }
  }

  await walk(rootDir, 0);
  return results;
}

/**
 * Spawns Async.
 * @param {*} command
 * @param {*} args
 * @param {*} options
 * @returns {*}
 */
function spawnAsync(command, args = [], options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    shell = false,
    stdio = "pipe",
  } = options;

  return new Promise(/**
   * Functions a value.
   * @param {*} resolve
   * @param {*} reject
   */
  (resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell,
      windowsHide: true,
      stdio: stdio === "inherit" ? "inherit" : ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout && stdio !== "inherit") {
      child.stdout.on("data", /**
       * Functions a value.
       * @param {*} chunk
       */
      chunk => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr && stdio !== "inherit") {
      child.stderr.on("data", /**
       * Functions a value.
       * @param {*} chunk
       */
      chunk => {
        stderr += chunk.toString();
      });
    }

    child.on("error", /**
     * Functions a value.
     * @param {*} error
     */
    error => {
      const result = {
        ok: false,
        stdout,
        stderr: stderr || error.message,
        code: error.code ?? 1,
      };
      if (options.reject === false) {
        resolve(result);
      } else {
        reject(
          Object.assign(
            new Error(result.stderr || result.stdout || error.message),
            result
          )
        );
      }
    });

    child.on("close", /**
     * Functions a value.
     * @param {*} code
     */
    code => {
      const result = {
        ok: code === 0,
        stdout,
        stderr,
        code: code ?? 0,
      };

      if (result.ok || options.reject === false) {
        resolve(result);
        return;
      }

      reject(
        Object.assign(
          new Error(
            result.stderr || result.stdout || `Command failed: ${command}`
          ),
          result
        )
      );
    });
  });
}

/**
 * Runs Command.
 * @param {*} command
 * @param {*} args
 * @param {*} options
 * @returns {Promise<*>}
 */
export async function runCommand(command, args = [], options = {}) {
  return spawnAsync(command, args, options);
}

/**
 * Detects Command.
 * @param {*} command
 * @param {*} args
 * @returns {Promise<*>}
 */
export async function detectCommand(command, args = ["--version"]) {
  const result = await runCommand(command, args, { reject: false });
  return result.ok;
}

/**
 * Pythons Zip List.
 * @param {*} filePath
 * @returns {Promise<*>}
 */
async function pythonZipList(filePath) {
  const script = [
    "import sys, zipfile",
    "zf = zipfile.ZipFile(sys.argv[1])",
    "for info in zf.infolist():",
    "    if info.is_dir():",
    "        continue",
    "    print(f'{info.file_size}\t{info.filename}')",
  ].join("; ");
  const result = await runCommand("python3", ["-c", script, filePath], {
    reject: false,
  });
  if (result.ok && result.stdout.trim()) return result.stdout;
  const result2 = await runCommand("python", ["-c", script, filePath], {
    reject: false,
  });
  if (result2.ok) return result2.stdout;
  throw new Error(
    result.stderr ||
      result.stdout ||
      result2.stderr ||
      result2.stdout ||
      `Failed to read zip: ${filePath}`
  );
}

/**
 * Lists Zip Entries With Unzip.
 * @param {*} filePath
 * @returns {Promise<*>}
 */
export async function listZipEntriesWithUnzip(filePath) {
  const unzipResult = await runCommand("unzip", ["-l", filePath], {
    reject: false,
  });
  if (unzipResult.ok) {
    return unzipResult.stdout;
  }
  return pythonZipList(filePath);
}

/**
 * Humans Bytes.
 * @param {*} bytes
 * @returns {string}
 */
export function humanBytes(bytes = 0) {
  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes) || 0;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

/**
 * Picks First Defined.
 * @param {*} ...values
 * @returns {*}
 */
export function pickFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "")
      return value;
  }
  return undefined;
}

/**
 * Escapes Reg Exp.
 * @param {*} input
 * @returns {*}
 */
export function escapeRegExp(input = "") {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Capitalizes a value.
 * @param {*} input
 * @returns {*}
 */
export function capitalize(input = "") {
  const s = String(input);
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Ass Array.
 * @param {*} value
 * @returns {*}
 */
export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

/**
 * Reads Json.
 * @param {*} filePath
 * @param {*} fallback
 * @returns {Promise<*>}
 */
export async function readJson(filePath, fallback = null) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/**
 * Safes File Name.
 * @param {*} input
 * @returns {*}
 */
export function safeFileName(input = "") {
  return String(input)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}
