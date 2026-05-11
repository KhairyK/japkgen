import path, { normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { fileExists, readJson } from "./utils.js";

export const CONFIG_FILES = [
  "japkgen.config.mjs",
  "japkgen.config.js",
  "japkgen.config.json"
];

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function pickConfigRoot(raw) {
  if (!raw || typeof raw !== "object") return {};
  if (raw.japkgen && typeof raw.japkgen === "object") return raw.japkgen;
  if (raw.default && typeof raw.default === "object") return raw.default;
  return raw;
}

function normalizeConfig(raw, filePath = null) {
  const root = pickConfigRoot(raw);
  const defaults = {
    ...normalizeObject(root.defaults),
    ...normalizeObject(root.default),
    ...normalizeObject(root.settings)
  };

  for (const key of [
    "name",
    "package",
    "packageName",
    "template",
    "minSdk",
    "targetSdk",
    "compileSdk",
    "url",
    "permissions",
    "icon",
    "signing",
    "keystore",
    "keyAlias",
    "storePassword",
    "keyPassword",
    "variant",
    "port",
    "watch",
    "gradleVersion"
  ]) {
    if (root[key] !== undefined && defaults[key] === undefined) {
      defaults[key] = root[key];
    }
  }

  return {
    path: filePath,
    raw: root,
    defaults,
    plugins: Array.isArray(root.plugins) ? root.plugins : [],
    templates: normalizeObject(root.templates)
  };
}

async function tryLoadModule(filePath) {
  const mod = await import(pathToFileURL(filePath).href);
  return mod?.default ?? mod?.config ?? mod;
}

export async function loadProjectConfig(cwd = process.cwd()) {
  for (const fileName of CONFIG_FILES) {
    const filePath = path.resolve(cwd, fileName);
    if (!(await fileExists(filePath))) continue;

    if (filePath.endsWith(".json")) {
      const raw = await readJson(filePath, null);
      return normalizeConfig(raw, filePath);
    }

    try {
      const raw = await tryLoadModule(filePath);
      return normalizeConfig(raw, filePath);
    } catch {
      return normalizeConfig({}, filePath);
    }
  }

  return normalizeConfig({}, null);
}
