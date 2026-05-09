import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileExists, readJson } from "./utils.js";
import { PLUGIN_CONFIG_FILES } from "./constants.js";

function normalizeTemplateExport(value) {
  if (!value) return null;
  if (typeof value === "function") return { factory: value };
  if (typeof value !== "object") return null;
  return value;
}

function normalizePlugin(plugin, origin = "unknown") {
  if (!plugin || typeof plugin !== "object") return null;

  const normalized = {
    name: String(plugin.name || origin),
    templates: {},
    hooks: {
      beforeGenerate: [],
      afterGenerate: [],
      beforeWrite: [],
      afterWrite: []
    }
  };

  if (plugin.templates && typeof plugin.templates === "object") {
    for (const [name, template] of Object.entries(plugin.templates)) {
      const normalizedTemplate = normalizeTemplateExport(template);
      if (normalizedTemplate) normalized.templates[name] = normalizedTemplate;
    }
  }

  for (const hookName of Object.keys(normalized.hooks)) {
    const hook = plugin[hookName];
    if (typeof hook === "function") {
      normalized.hooks[hookName].push(hook);
    } else if (Array.isArray(hook)) {
      for (const fn of hook) {
        if (typeof fn === "function") normalized.hooks[hookName].push(fn);
      }
    }
  }

  return normalized;
}

async function tryImport(filePath) {
  try {
    return await import(pathToFileURL(filePath).href);
  } catch {
    return null;
  }
}

function collectFromModule(mod, origin) {
  if (!mod) return null;
  const candidates = [];
  if (mod.default) candidates.push(mod.default);
  candidates.push(mod);
  const plugins = [];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const normalized = normalizePlugin(item, origin);
        if (normalized) plugins.push(normalized);
      }
      continue;
    }
    const normalized = normalizePlugin(candidate, origin);
    if (normalized) plugins.push(normalized);
  }

  return plugins;
}

export async function loadPlugins(projectDir = process.cwd()) {
  const roots = [projectDir, process.cwd()];
  const seen = new Set();
  const plugins = [];

  for (const root of roots) {
    for (const fileName of PLUGIN_CONFIG_FILES) {
      const filePath = path.join(root, fileName);
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      if (!(await fileExists(filePath))) continue;
      const mod = await tryImport(filePath);
      const collected = collectFromModule(mod, fileName);
      if (collected) plugins.push(...collected);
    }

    const packageJson = path.join(root, "package.json");
    if (await fileExists(packageJson)) {
      const pkg = await readJson(packageJson, null);
      const pluginField = pkg?.japkgen?.plugins;
      if (Array.isArray(pluginField)) {
        for (const item of pluginField) {
          if (typeof item !== "string") continue;
          const pluginPath = path.resolve(root, item);
          if (seen.has(pluginPath)) continue;
          seen.add(pluginPath);
          if (!(await fileExists(pluginPath))) continue;
          const mod = await tryImport(pluginPath);
          const collected = collectFromModule(mod, pluginPath);
          if (collected) plugins.push(...collected);
        }
      }
    }
  }

  const templates = {};
  const hooks = {
    beforeGenerate: [],
    afterGenerate: [],
    beforeWrite: [],
    afterWrite: []
  };

  for (const plugin of plugins) {
    for (const [name, template] of Object.entries(plugin.templates)) {
      templates[name.toLowerCase()] = template;
    }
    for (const key of Object.keys(hooks)) {
      hooks[key].push(...(plugin.hooks[key] || []));
    }
  }

  return { plugins, templates, hooks };
}

export async function runHooks(hooks, context) {
  for (const hook of hooks || []) {
    await hook(context);
  }
}
