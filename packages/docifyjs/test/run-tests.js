import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve('.');
const cli = path.join(root, 'bin', 'docify.js');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'docifyjs-'));
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function run(args, cwd = root) {
  return execFileSync('node', [cli, ...args], { cwd, encoding: 'utf8' });
}

// Test 1: JS + arrow + class method.
{
  const dir = tmpDir();
  const file = path.join(dir, 'sample.js');
  write(
    file,
    `function add(a, b) {\n  return a + b;\n}\n\nconst multiply = (a, b) => a * b;\n\nclass Calc {\n  square(n) {\n    return n * n;\n  }\n}\n`
  );

  const out = run([file, '--write']);
  assert.match(out, /Wrote sample\.js/);
  const saved = fs.readFileSync(file, 'utf8');
  assert.ok(saved.includes('/**'));
  assert.ok(saved.includes('@param {*} a'));
  assert.ok(saved.includes('@param {*} b'));
  assert.ok(saved.includes('@returns {number}'));
  assert.ok(saved.includes('function add(a, b)'));
  assert.ok(saved.includes('const multiply = (a, b) => a * b;'));
  assert.ok(saved.includes('square(n)'));
}

// Test 2: TypeScript support.
{
  const dir = tmpDir();
  const file = path.join(dir, 'sample.ts');
  write(
    file,
    `export const greet = (name: string): string => {\n  return \`Hello, ${'${name}'}\`;\n};\n\nexport async function loadUser(id: number) {\n  return { id };\n}\n`
  );

  run([file, '--write', '--ai']);
  const saved = fs.readFileSync(file, 'utf8');
  assert.ok(saved.includes('@param {string} name'));
  assert.ok(saved.includes('@returns {string}'));
  assert.ok(saved.includes('@param {number} id'));
  assert.ok(saved.includes('Promise<'));
}

// Test 3: plugin system.
{
  const dir = tmpDir();
  const file = path.join(dir, 'plugin.js');
  const pluginFile = path.join(dir, 'my-plugin.mjs');
  write(
    file,
    `function hello(name) {\n  return name;\n}\n`
  );
  write(
    pluginFile,
    `export default {\n  description(info) {\n    if (info.name === 'hello') return 'Says hello from plugin.';\n  }\n};\n`
  );

  run([file, '--write', '--plugin', pluginFile], dir);
  const saved = fs.readFileSync(file, 'utf8');
  assert.match(saved, /Says hello from plugin\./);
}

// Test 4: exported declaration placement.
{
  const dir = tmpDir();
  const file = path.join(dir, 'exported.js');
  write(
    file,
    `export function walk(node, visitor, state = {}) {\n  return node;\n}\n\nexport const sum = (a, b) => a + b;\n`
  );

  run([file, '--write']);
  const saved = fs.readFileSync(file, 'utf8');
  assert.match(saved, /\/\*\*[\s\S]*?\*\/\nexport function walk/);
  assert.match(saved, /\/\*\*[\s\S]*?\*\/\nexport const sum/);
  assert.doesNotMatch(saved, /export \/\*\*/);
}

// Test 5: multi-file CLI.
{
  const dir = tmpDir();
  const a = path.join(dir, 'a.js');
  const b = path.join(dir, 'b.js');
  write(a, `function a1(x) { return x; }\n`);
  write(b, `function b1(y) { return y; }\n`);

  const out = run([a, b, '--write', '--quiet']);
  assert.match(fs.readFileSync(a, 'utf8'), /@returns \{\*\}/);
  assert.match(fs.readFileSync(b, 'utf8'), /@returns \{\*\}/);
  assert.equal(out.trim(), '');
}

console.log('All tests passed.');
