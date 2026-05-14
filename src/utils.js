import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

export function normalizePathValue(input = "") {
  return String(input)
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "");
}

export function toPackagePath(pkg = "") {
  return normalizePathValue(String(pkg).trim().replaceAll(".", "/"));
}

export function toJniPackage(pkg = "") {
  return normalizePathValue(String(pkg).trim().replaceAll(".", "/")).replaceAll(
    "/",
    "_"
  );
}

export function applyTemplate(content, vars) {
  return String(content).replace(/__([A-Z0-9_]+)__/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key)
      ? String(vars[key])
      : match;
  });
}

export function parseList(input = "") {
  if (Array.isArray(input)) {
    return input.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(input)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parsePermissions(input = "") {
  return parseList(input).map((perm) =>
    perm.startsWith("android.permission.") ? perm : `android.permission.${perm}`
  );
}

export function uniq(list = []) {
  return [...new Set(list.filter(Boolean))];
}

export function hasHttpUrl(url = "") {
  return /^https?:\/\//i.test(String(url).trim());
}

export function normalizeBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

export async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

export async function fileExistsAny(paths = []) {
  for (const p of paths) {
    if (!p) continue;
    if (await fileExists(p)) return p;
  }
  return null;
}

export function normalizeRelPath(input = "") {
  return String(input).replaceAll("\\", "/");
}

export async function findFiles(rootDir, predicate = () => true, options = {}) {
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

function spawnAsync(command, args = [], options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    shell = false,
    stdio = "pipe",
  } = options;

  return new Promise((resolve, reject) => {
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
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr && stdio !== "inherit") {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", (error) => {
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

    child.on("close", (code) => {
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

export async function runCommand(command, args = [], options = {}) {
  return spawnAsync(command, args, options);
}

export async function detectCommand(command, args = ["--version"]) {
  const result = await runCommand(command, args, { reject: false });
  return result.ok;
}

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

export async function listZipEntriesWithUnzip(filePath) {
  const unzipResult = await runCommand("unzip", ["-l", filePath], {
    reject: false,
  });
  if (unzipResult.ok) {
    return unzipResult.stdout;
  }
  return pythonZipList(filePath);
}

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

export function pickFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "")
      return value;
  }
  return undefined;
}

export function escapeRegExp(input = "") {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function capitalize(input = "") {
  const s = String(input);
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

export async function readJson(filePath, fallback = null) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function safeFileName(input = "") {
  return String(input)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}
