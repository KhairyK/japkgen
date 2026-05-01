import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';

export function normalizePathValue(input = '') {
  return String(input)
    .replaceAll('\\', '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '');
}

export function toPackagePath(pkg = '') {
  return normalizePathValue(String(pkg).trim().replaceAll('.', '/'));
}

export function toJniPackage(pkg = '') {
  return normalizePathValue(String(pkg).trim().replaceAll('.', '/')).replace(/\//g, '_');
}

export function applyTemplate(content, vars) {
  return String(content).replace(/__([A-Z0-9_]+)__/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
  });
}

export function parseList(input = '') {
  return String(input)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parsePermissions(input = '') {
  return parseList(input).map((perm) => {
    if (perm.startsWith('android.permission.')) return perm;
    return `android.permission.${perm}`;
  });
}

export function uniq(list = []) {
  return [...new Set(list.filter(Boolean))];
}

export function hasHttpUrl(url = '') {
  return /^https?:\/\//i.test(String(url).trim());
}

export async function writeFileEnsured(filePath, content) {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

export async function templateExists(projectDir) {
  const gradlew =
    process.platform === 'win32'
      ? path.join(projectDir, 'gradlew.bat')
      : path.join(projectDir, 'gradlew');

  const wrapperJar = path.join(projectDir, 'gradle', 'wrapper', 'gradle-wrapper.jar');
  const wrapperProps = path.join(projectDir, 'gradle', 'wrapper', 'gradle-wrapper.properties');

  return (
    (await fs.pathExists(gradlew)) &&
    (await fs.pathExists(wrapperJar)) &&
    (await fs.pathExists(wrapperProps))
  );
}

export function getDefaultAndroidSdkPaths() {
  const home = os.homedir();

  if (process.platform === 'win32') {
    return [
      path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
      path.join(process.env.USERPROFILE || home, 'AppData', 'Local', 'Android', 'Sdk')
    ].filter(Boolean);
  }

  if (process.platform === 'darwin') {
    return [path.join(home, 'Library', 'Android', 'sdk')];
  }

  return [path.join(home, 'Android', 'Sdk')];
}

export async function fileExistsAny(paths = []) {
  for (const p of paths) {
    if (!p) continue;
    if (await fs.pathExists(p)) return p;
  }
  return null;
}