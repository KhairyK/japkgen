import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Loads Plugins.
 * @param {Object} param
 * @returns {Promise<*>}
 */
export async function loadPlugins({ cwd = process.cwd(), configPath, pluginPaths = [] } = {}) {
  const loaded = [];

  const config = await loadConfig({ cwd, configPath });
  const explicit = [
    ...pluginPaths,
    ...(Array.isArray(config?.plugins) ? config.plugins : [])
  ];

  for (const entry of explicit) {
    const plugin = await loadPluginEntry(entry, cwd);
    if (plugin) loaded.push(plugin);
  }

  return loaded;
}

/**
 * Loads Config.
 * @param {Object} param
 * @returns {Promise<*>}
 */
async function loadConfig({ cwd, configPath } = {}) {
  const candidates = configPath
    ? [configPath]
    : [
        'docify.config.js',
        'docify.config.mjs',
        'docify.config.cjs'
      ];

  for (const candidate of candidates) {
    const abs = path.isAbsolute(candidate) ? candidate : path.join(cwd, candidate);
    if (!fs.existsSync(abs)) continue;
    const mod = await import(pathToFileURL(abs).href + `?t=${Date.now()}`);
    return mod.default || mod;
  }

  return null;
}

/**
 * Loads Plugin Entry.
 * @param {*} entry
 * @param {*} cwd
 * @returns {Promise<*>}
 */
async function loadPluginEntry(entry, cwd) {
  if (!entry) return null;

  if (typeof entry === 'object') return entry;

  const abs = path.isAbsolute(entry) ? entry : path.join(cwd, entry);
  const mod = await import(pathToFileURL(abs).href + `?t=${Date.now()}`);
  return mod.default || mod;
}

/**
 * Runs Hook.
 * @param {*} plugins
 * @param {*} hookName
 * @param {*} ...args
 * @returns {Promise<*>}
 */
export async function runHook(plugins, hookName, ...args) {
  const results = [];
  for (const plugin of plugins) {
    const hook = plugin?.[hookName];
    if (typeof hook !== 'function') continue;
    const result = await hook(...args);
    if (result !== undefined) results.push(result);
  }
  return results;
}
