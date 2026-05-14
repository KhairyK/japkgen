import path from 'node:path';
import fs from 'node:fs/promises';
import { fileExists, writeFileEnsured, parseList, uniq } from './utils.js';
import { logger } from './logger.js';

function normalizeDependency(input = '') {
  const text = String(input).trim().replace(/^['"]|['"]$/g, '');
  if (!text) return null;
  return text;
}

function scopeOfDependency(line = '') {
  const match = String(line).trim().match(/^(implementation|api|compileOnly|runtimeOnly|kapt|debugImplementation|releaseImplementation|testImplementation|androidTestImplementation)\s+['"]([^'"]+)['"]/);
  if (!match) return null;
  return { scope: match[1], dependency: match[2] };
}

function dependencyLine(scope, dep) {
  return `    ${scope} '${dep}'`;
}

async function readBuildGradle(projectDir) {
  const buildGradlePath = path.join(projectDir, 'app', 'build.gradle');
  if (!(await fileExists(buildGradlePath))) {
    throw new Error(`Cannot find app/build.gradle in ${projectDir}`);
  }
  return { buildGradlePath, content: await fs.readFile(buildGradlePath, 'utf8') };
}

function updateDependenciesBlock(content, updater) {
  const match = content.match(/dependencies\s*\{[\s\S]*\n\}/m);
  if (!match) throw new Error('Could not find dependencies { } block in app/build.gradle');

  const block = match[0];
  const body = block.replace(/^dependencies\s*\{\n?/, '').replace(/\n\}$/,'');
  const newBody = updater(body).replace(/\n+$/, '');
  const nextBlock = `dependencies {\n${newBody}\n}`;
  return content.replace(block, nextBlock);
}

export async function listProjectDependencies(projectDir) {
  const { content } = await readBuildGradle(projectDir);
  const deps = [];
  const lines = content.split(/\r?\n/);
  let inDeps = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('dependencies')) {
      inDeps = true;
      continue;
    }
    if (inDeps && line === '}') break;
    if (!inDeps) continue;
    const parsed = scopeOfDependency(line);
    if (parsed) deps.push(parsed);
  }
  return deps;
}

export async function addProjectDependency(projectDir, dependency, scope = 'implementation') {
  const dep = normalizeDependency(dependency);
  if (!dep) throw new Error('Dependency coordinate is required.');

  const { buildGradlePath, content } = await readBuildGradle(projectDir);
  let updated = false;
  const next = updateDependenciesBlock(content, (body) => {
    const existing = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const targetLine = dependencyLine(scope, dep).trim();
    if (existing.some((line) => line.replace(/\s+/g, ' ') === targetLine.replace(/\s+/g, ' '))) {
      return body;
    }
    updated = true;
    const cleaned = body.replace(/\n+\s*$/, '');
    return `${cleaned}\n${dependencyLine(scope, dep)}`.trimEnd();
  });

  if (updated) {
    await fs.writeFile(buildGradlePath, next, 'utf8');
  }
  return { updated, buildGradlePath };
}

export async function removeProjectDependency(projectDir, dependency) {
  const dep = normalizeDependency(dependency);
  if (!dep) throw new Error('Dependency coordinate is required.');

  const { buildGradlePath, content } = await readBuildGradle(projectDir);
  let removed = false;
  const next = updateDependenciesBlock(content, (body) => {
    const lines = body.split(/\r?\n/);
    const filtered = lines.filter((line) => {
      const parsed = scopeOfDependency(line.trim());
      if (!parsed) return true;
      if (parsed.dependency === dep) {
        removed = true;
        return false;
      }
      return true;
    });
    return filtered.join('\n').replace(/\n{3,}/g, '\n\n');
  });

  if (removed) {
    await fs.writeFile(buildGradlePath, next, 'utf8');
  }
  return { removed, buildGradlePath };
}

export async function runDependencyManager(projectDirArg, options = {}) {
  const projectDir = path.resolve(projectDirArg || process.cwd());
  if (!(await fileExists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  const action = String(options.action || 'list').toLowerCase();
  logger.title('JAPKGEN Dependencies');
  logger.info(`Project: ${projectDir}`);

  if (action === 'list') {
    const deps = await listProjectDependencies(projectDir);
    if (!deps.length) {
      logger.warn('No dependencies found.');
      return { projectDir, action, dependencies: [] };
    }
    for (const dep of deps) {
      logger.bullet(dep.scope, dep.dependency);
    }
    return { projectDir, action, dependencies: deps };
  }

  if (action === 'add') {
    const dependency = normalizeDependency(options.dependency || options.dep || options.value);
    const scope = String(options.scope || 'implementation').trim() || 'implementation';
    const result = await addProjectDependency(projectDir, dependency, scope);
    if (result.updated) logger.success(`Added ${scope}: ${dependency}`);
    else logger.note(`Dependency already exists: ${dependency}`);
    return { projectDir, action, ...result };
  }

  if (action === 'remove') {
    const dependency = normalizeDependency(options.dependency || options.dep || options.value);
    const result = await removeProjectDependency(projectDir, dependency);
    if (result.removed) logger.success(`Removed dependency: ${dependency}`);
    else logger.note(`Dependency not found: ${dependency}`);
    return { projectDir, action, ...result };
  }

  throw new Error(`Unknown dependency action: ${action}`);
}
