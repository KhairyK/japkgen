import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { generateProject } from '../src/generator.js';
import { runProjectTests } from '../src/test.js';
import { loadProjectConfig } from '../src/config.js';
import { detectEnvironment } from '../src/environment.js';
import {
  applyTemplate,
  asArray,
  capitalize,
  fileExists,
  fileExistsAny,
  findFiles,
  hasHttpUrl,
  humanBytes,
  normalizeBoolean,
  normalizePathValue,
  normalizeRelPath,
  parseList,
  parsePermissions,
  pickFirstDefined,
  readJson,
  readText,
  runCommand,
  safeFileName,
  templateExists,
  toJniPackage,
  toPackagePath,
  uniq,
  writeFileEnsured
} from '../src/utils.js';

async function withTempCwd(fn) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'japkgen-test-'));
  const previousCwd = process.cwd();

  process.chdir(tempDir);
  try {
    return await fn(tempDir);
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function read(filePath) {
  return fs.readFile(filePath, 'utf8');
}

function sourceFilePath(packageName, kind, fileName) {
  return path.join(
    'app',
    'src',
    'main',
    kind,
    ...packageName.split('.'),
    fileName
  );
}

async function assertGeneratedTemplate({ template, name, packageName, checks }) {
  await withTempCwd(async () => {
    const result = await generateProject({
      noPrompt: true,
      name,
      package: packageName,
      template,
      minSdk: 24,
      targetSdk: 34,
      compileSdk: 34,
      url: 'https://example.com'
    });

    assert.equal(await exists(result.projectDir), true);
    await checks(result.projectDir, result);
  });
}

test('utils: path, parsing, formatting, and template helpers behave correctly', async () => {
  assert.equal(normalizePathValue('\\/foo//bar\\baz'), 'foo/bar/baz');
  assert.equal(toPackagePath('com.example.app'), 'com/example/app');
  assert.equal(toJniPackage('com.example.app'), 'com_example_app');
  assert.equal(applyTemplate('Hello __NAME__!', { NAME: 'World' }), 'Hello World!');
  assert.deepEqual(parseList('a, b, c'), ['a', 'b', 'c']);
  assert.deepEqual(parsePermissions('INTERNET, android.permission.CAMERA'), [
    'android.permission.INTERNET',
    'android.permission.CAMERA'
  ]);
  assert.deepEqual(uniq(['a', 'a', 'b']), ['a', 'b']);
  assert.equal(hasHttpUrl('https://example.com'), true);
  assert.equal(hasHttpUrl('ftp://example.com'), false);
  assert.equal(normalizeBoolean('yes'), true);
  assert.equal(normalizeBoolean('off'), false);
  assert.equal(pickFirstDefined(undefined, null, '', 'first', 'second'), 'first');
  assert.equal(capitalize('hello'), 'Hello');
  assert.deepEqual(asArray('x'), ['x']);
  assert.deepEqual(asArray(['x', 'y']), ['x', 'y']);
  assert.equal(humanBytes(1536), '1.5 KB');
  assert.equal(normalizeRelPath('a\\b\\c'), 'a/b/c');
  assert.match(safeFileName('bad<>:"/\\|?*name'), /^bad_+name$/);
});

test('utils: file IO helpers and command runner work in a clean temp directory', async () => {
  await withTempCwd(async (cwd) => {
    const nested = path.join(cwd, 'nested', 'file.txt');
    await writeFileEnsured(nested, 'hello world');

    assert.equal(await fileExists(nested), true);
    assert.equal(await readText(nested), 'hello world');
    assert.deepEqual(await readJson(path.join(cwd, 'missing.json'), { ok: true }), { ok: true });

    const found = await findFiles(cwd, (_abs, rel) => rel.endsWith('file.txt'));
    assert.equal(found.length, 1);
    assert.equal(found[0].rel, 'nested/file.txt');

    const echo = process.platform === 'win32'
      ? await runCommand('cmd', ['/c', 'echo', 'ok'], { reject: false })
      : await runCommand('sh', ['-lc', 'printf ok'], { reject: false });

    assert.equal(echo.ok, true);
    assert.match((echo.stdout || echo.stderr || '').trim(), /ok/);

    const firstExisting = await fileExistsAny([path.join(cwd, 'missing'), nested]);
    assert.equal(firstExisting, nested);
  });
});

test('utils: detects a Gradle wrapper layout correctly', async () => {
  await withTempCwd(async (cwd) => {
    const wrapperDir = path.join(cwd, 'sample', 'gradle', 'wrapper');
    await fs.mkdir(wrapperDir, { recursive: true });

    await fs.writeFile(
      path.join(cwd, 'sample', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'),
      'echo'
    );
    await fs.writeFile(path.join(wrapperDir, 'gradle-wrapper.jar'), 'jar');
    await fs.writeFile(path.join(wrapperDir, 'gradle-wrapper.properties'), 'distributionUrl=x');

    assert.equal(await templateExists(path.join(cwd, 'sample')), true);
  });
});

test('config: loads japkgen.config.json defaults and template overrides', async () => {
  await withTempCwd(async (cwd) => {
    await fs.writeFile(
      path.join(cwd, 'japkgen.config.json'),
      JSON.stringify(
        {
          defaults: {
            name: 'Config App',
            package: 'com.example.configapp',
            template: 'kotlin',
            minSdk: 26,
            targetSdk: 34,
            compileSdk: 34,
            url: 'https://config.example'
          },
          templates: {
            custom: {
              title: 'Custom Template',
              files: {
                'README.md': '# Custom\n'
              }
            }
          }
        },
        null,
        2
      )
    );

    const config = await loadProjectConfig(cwd);
    assert.equal(config.path.endsWith('japkgen.config.json'), true);
    assert.equal(config.defaults.name, 'Config App');
    assert.equal(config.defaults.package, 'com.example.configapp');
    assert.equal(config.defaults.template, 'kotlin');
    assert.equal(config.templates.custom.title, 'Custom Template');
  });
});

test('environment: returns a structured environment snapshot even when tools are missing', async () => {
  const env = await detectEnvironment();
  assert.equal(typeof env.platform, 'string');
  assert.equal(typeof env.arch, 'string');
  assert.equal(typeof env.node, 'string');
  assert.equal(typeof env.cwd, 'string');
  assert.equal(typeof env.packageManagers, 'object');
  assert.ok(Object.hasOwn(env.packageManagers, 'npm'));
  assert.ok(Object.hasOwn(env.packageManagers, 'pnpm'));
  assert.ok(Object.hasOwn(env.packageManagers, 'yarn'));
  assert.equal('recommendedJava' in env, true);
});

test('generator: creates a React + Vite template with fonts and web assets', async () => {
  await assertGeneratedTemplate({
    template: 'react',
    name: 'React Sample',
    packageName: 'com.example.reactsample',
    checks: async (projectDir) => {
      assert.equal(await exists(path.join(projectDir, 'frontend', 'vite.config.js')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'src', 'main.jsx')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'index.html')), true);
      assert.equal(await exists(path.join(projectDir, 'app', 'src', 'main', 'assets', 'www', 'index.html')), true);

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Vite/i);
      assert.match(readme, /Google Fonts/i);
      assert.match(readme, /React/i);

      const html = await read(path.join(projectDir, 'frontend', 'index.html'));
      assert.match(html, /fonts\.googleapis\.com/i);
    }
  });
});

test('generator: creates a Vue + Vite template with framework-specific entry files', async () => {
  await assertGeneratedTemplate({
    template: 'vue',
    name: 'Vue Sample',
    packageName: 'com.example.vuesample',
    checks: async (projectDir) => {
      assert.equal(await exists(path.join(projectDir, 'frontend', 'vite.config.js')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'src', 'main.js')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'src', 'App.vue')), true);

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Vue/i);
      assert.match(readme, /Vite/i);
    }
  });
});

test('generator: creates an Angular + Vite template with TypeScript sources', async () => {
  await assertGeneratedTemplate({
    template: 'angular',
    name: 'Angular Sample',
    packageName: 'com.example.angularsample',
    checks: async (projectDir) => {
      assert.equal(await exists(path.join(projectDir, 'frontend', 'vite.config.ts')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'src', 'main.ts')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'src', 'app', 'app.component.ts')), true);

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Angular/i);
      assert.match(readme, /Vite/i);
    }
  });
});

test('generator: creates a Preact + Vite template with compact frontend output', async () => {
  await assertGeneratedTemplate({
    template: 'preact',
    name: 'Preact Sample',
    packageName: 'com.example.preactsample',
    checks: async (projectDir) => {
      assert.equal(await exists(path.join(projectDir, 'frontend', 'vite.config.js')), true);
      assert.equal(await exists(path.join(projectDir, 'frontend', 'src', 'main.jsx')), true);

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Preact/i);
      assert.match(readme, /Vite/i);
    }
  });
});

test('generator: creates a Jetpack Compose template with Compose dependencies', async () => {
  await assertGeneratedTemplate({
    template: 'compose',
    name: 'Compose Sample',
    packageName: 'com.example.composesample',
    checks: async (projectDir) => {
      const appGradle = await read(path.join(projectDir, 'app', 'build.gradle'));
      assert.match(appGradle, /compose\s+true/);
      assert.match(appGradle, /compose-bom/);
      assert.match(appGradle, /activity-compose/);

      assert.equal(
        await exists(path.join(projectDir, sourceFilePath('com.example.composesample', 'kotlin', 'MainActivity.kt'))),
        true
      );

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Compose/i);
    }
  });
});

test('generator: creates an optimized Kotlin template', async () => {
  await assertGeneratedTemplate({
    template: 'kotlin',
    name: 'Kotlin Sample',
    packageName: 'com.example.kotlinsample',
    checks: async (projectDir) => {
      const appGradle = await read(path.join(projectDir, 'app', 'build.gradle'));
      assert.match(appGradle, /org\.jetbrains\.kotlin\.android/);

      assert.equal(
        await exists(path.join(projectDir, sourceFilePath('com.example.kotlinsample', 'kotlin', 'MainActivity.kt'))),
        true
      );

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Kotlin/i);
    }
  });
});

test('generator: creates a Java game template with a custom GameView', async () => {
  await assertGeneratedTemplate({
    template: 'game-java',
    name: 'Game Java Sample',
    packageName: 'com.example.gamejavasample',
    checks: async (projectDir) => {
      assert.equal(
        await exists(path.join(projectDir, sourceFilePath('com.example.gamejavasample', 'java', 'GameView.java'))),
        true
      );

      const mainActivity = await read(path.join(projectDir, sourceFilePath('com.example.gamejavasample', 'java', 'MainActivity.java')));
      assert.match(mainActivity, /FLAG_KEEP_SCREEN_ON/);

      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /Game/i);
    }
  });
});

test.skip('generator: creates a native C/C++ game template with CMake integration', async () => {
  await assertGeneratedTemplate({
    template: 'game-cpp',
    name: 'Game Cpp Sample',
    packageName: 'com.example.gamecppsample',
    checks: async (projectDir) => {
      const cppDir = path.join(projectDir, 'app', 'src', 'main', 'cpp');

      assert.equal(await exists(path.join(cppDir, 'CMakeLists.txt')), true);
      assert.equal(await exists(path.join(cppDir, 'native-lib.cpp')), true);

      const cmake = await read(path.join(cppDir, 'CMakeLists.txt'));
      assert.match(cmake, /project\("japkgen_game"\)/);
      assert.match(cmake, /native-lib/);

      const mainActivity = await read(path.join(projectDir, sourceFilePath('com.example.gamecppsample', 'java', 'MainActivity.java')));
      assert.match(mainActivity, /System\.loadLibrary\("native-lib"\)/);
    }
  });
});

test('generator: supports config-driven defaults and can run the built-in project tester', async () => {
  await withTempCwd(async () => {
    await fs.writeFile(
      'japkgen.config.json',
      JSON.stringify(
        {
          defaults: {
            name: 'Config Driven App',
            package: 'com.example.configdriven',
            template: 'kotlin',
            minSdk: 24,
            targetSdk: 34,
            compileSdk: 34,
            url: 'https://example.com'
          }
        },
        null,
        2
      )
    );

    const result = await generateProject({ noPrompt: true });
    assert.match(result.projectDir, /Config Driven App$/);
    assert.equal(await exists(path.join(result.projectDir, 'README.md')), true);

    const report = await runProjectTests(result.projectDir);
    assert.equal(report.ok, true);
    assert.ok(report.checks.length > 0);
  });
});

test('generator: rejects unknown templates with a clear error', async () => {
  await withTempCwd(async () => {
    await assert.rejects(
      () =>
        generateProject({
          noPrompt: true,
          name: 'Broken Sample',
          package: 'com.example.broken',
          template: 'does-not-exist'
        }),
      /Unknown template/i
    );
  });
});