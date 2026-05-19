import fs from 'node:fs';
import path from 'node:path';
import recast from 'recast';
import { createParser } from './parser.js';
import { loadPlugins, runHook } from './plugin.js';
import { generateDocs } from './insert.js';

/**
 * Processs File.
 * @param {*} filename
 * @param {*} options
 * @returns {Promise<Object>}
 */
export async function processFile(filename, options = {}) {
  const abs = path.resolve(filename);
  const source = fs.readFileSync(abs, 'utf8');
  const parser = createParser({ filename: abs });
  const plugins = await loadPlugins({
    cwd: path.dirname(abs),
    configPath: options.config,
    pluginPaths: options.plugins || []
  });

  const ast = recast.parse(source, { parser });
  const docs = generateDocs(ast, source, {
    plugins,
    ai: { enabled: !!options.ai, provider: options.aiProvider },
    overwrite: !!options.overwrite
  });

  const beforeResults = await runHook(plugins, 'beforeWrite', { filename: abs, source, ast, docs, options });
  void beforeResults;

  const output = recast.print(ast).code;

  if (options.write) {
    fs.writeFileSync(abs, output);
  }

  await runHook(plugins, 'afterWrite', { filename: abs, source, output, ast, docs, options });

  return { filename: abs, source, output, docs, plugins };
}
