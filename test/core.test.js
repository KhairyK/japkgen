import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { generateProject } from '../src/generator.js';
import { runProjectTests, isLikelyWebUrl } from '../src/test.js';
import { loadProjectConfig } from '../src/config.js';
import { loadPlugins, runHooks } from '../src/plugins.js';
import {
  addProjectDependency,
  listProjectDependencies,
  removeProjectDependency,
  runDependencyManager,
} from '../src/dependency-manager.js';
import { sanitizeAlias, writeSigningFiles } from '../src/signing.js';
import { DEFAULTS, SUPPORTED_TEMPLATES } from '../src/constants.js';
import { templateNames } from '../src/templates.js';
import {
  applyTemplate,
  asArray,
  capitalize,
  escapeRegExp,
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
  safeFileName,
  templateExists,
  toJniPackage,
  toPackagePath,
  uniq,
  writeFileEnsured,
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

async function writeJson(filePath, value) {
  await writeFileEnsured(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function hasAnyExisting(files) {
  for (const file of files) {
    if (await exists(file)) {
      return true;
    }
  }

  return false;
}

async function hasAndroidSource(projectDir) {
  const sourceFiles = await findFiles(
    path.join(projectDir, 'app', 'src', 'main'),
    (abs, rel) => /\.(kt|java)$/i.test(rel)
  );

  return sourceFiles.length > 0;
}

async function hasNativeFiles(projectDir) {
  const nativeFiles = await findFiles(
    projectDir,
    (abs, rel) =>
      /(^|\/)cpp\//i.test(rel) ||
      /CMakeLists\.txt$/i.test(rel) ||
      /\.(c|cc|cpp|h|hpp|mk)$/i.test(rel)
  );

  return nativeFiles.length > 0;
}

async function hasWebFiles(projectDir) {
  const webFiles = await findFiles(
    projectDir,
    (abs, rel) => /\.(html|htm|js|jsx|ts|tsx|css|json)$/i.test(rel)
  );

  return webFiles.length > 0;
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
      url: 'https://example.com',
    });

    assert.equal(await exists(result.projectDir), true);
    assert.equal(result.templateName, template);
    assert.equal(result.packageName, packageName);
    assert.equal(result.projectName, name);

    await checks(result.projectDir, result);
  });
}

async function createMinimalProject(projectDir) {
  const appDir = path.join(projectDir, 'app');
  const mainDir = path.join(appDir, 'src', 'main');
  const javaDir = path.join(mainDir, 'java', 'com', 'example', 'demo');
  const assetsDir = path.join(mainDir, 'assets');

  await fs.mkdir(javaDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });

  await writeFileEnsured(
    path.join(projectDir, 'settings.gradle'),
    "rootProject.name = 'Demo'\ninclude ':app'\n"
  );

  await writeFileEnsured(
    path.join(projectDir, 'README.md'),
    '# Demo\n'
  );

  await writeFileEnsured(
    path.join(appDir, 'build.gradle'),
    [
      'plugins {',
      "    id 'com.android.application'",
      '}',
      '',
      'android {',
      '    namespace "com.example.demo"',
      '    compileSdk 34',
      '    defaultConfig {',
      '        applicationId "com.example.demo"',
      '        minSdk 24',
      '        targetSdk 34',
      '    }',
      '}',
      '',
      'dependencies {',
      "    implementation 'androidx.core:core-ktx:1.13.1'",
      "    implementation 'androidx.appcompat:appcompat:1.7.0'",
      '}',
      '',
    ].join('\n')
  );

  await writeFileEnsured(
    path.join(mainDir, 'AndroidManifest.xml'),
    [
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.demo">',
      '    <application android:label="Demo">',
      '        <activity android:name=".MainActivity" />',
      '    </application>',
      '</manifest>',
      '',
    ].join('\n')
  );

  await writeFileEnsured(
    path.join(javaDir, 'MainActivity.java'),
    [
      'package com.example.demo;',
      '',
      'public class MainActivity {}',
      '',
    ].join('\n')
  );

  await writeFileEnsured(
    path.join(assetsDir, 'index.html'),
    '<!doctype html><html><body>Hello</body></html>\n'
  );

  return { appDir, mainDir, javaDir, assetsDir };
}

// -----------------------------------------------------------------------------
// utils
// -----------------------------------------------------------------------------

test('utils: normalizes, parses, and formats values consistently', async () => {
  assert.equal(normalizePathValue('\\foo\\bar//baz'), 'foo/bar/baz');
  assert.equal(normalizePathValue('./foo/bar'), 'foo/bar');
  assert.equal(normalizePathValue('/foo/bar'), 'foo/bar');

  assert.equal(toPackagePath('com.example.demo'), 'com/example/demo');
  assert.equal(toJniPackage('com.example.demo'), 'com_example_demo');

  assert.equal(applyTemplate('Hello __NAME__!', { NAME: 'World' }), 'Hello World!');
  assert.equal(applyTemplate('__KEEP__', { OTHER: 'x' }), '__KEEP__');

  assert.deepEqual(parseList('a, b, , c'), ['a', 'b', 'c']);
  assert.deepEqual(parseList([' a ', '', 'b']), ['a', 'b']);
  assert.deepEqual(parsePermissions('INTERNET, android.permission.CAMERA'), [
    'android.permission.INTERNET',
    'android.permission.CAMERA',
  ]);

  assert.deepEqual(uniq(['a', 'a', '', 'b', 'c', 'c']), ['a', 'b', 'c']);
  assert.equal(hasHttpUrl('https://example.com'), true);
  assert.equal(hasHttpUrl('ftp://example.com'), false);

  assert.equal(normalizeBoolean(true), true);
  assert.equal(normalizeBoolean('YES'), true);
  assert.equal(normalizeBoolean('off', true), false);
  assert.equal(normalizeBoolean('maybe', true), true);

  assert.equal(humanBytes(0), '0 B');
  assert.equal(humanBytes(1536), '1.5 KB');
  assert.equal(humanBytes(10 * 1024 * 1024), '10 MB');

  assert.equal(pickFirstDefined(undefined, null, '', 'alpha', 'beta'), 'alpha');
  assert.equal(escapeRegExp('a+b?(c)'), 'a\\+b\\?\\(c\\)');
  assert.equal(capitalize('hello'), 'Hello');
  assert.deepEqual(asArray('x'), ['x']);
  assert.deepEqual(asArray(['x']), ['x']);
  assert.deepEqual(asArray(null), []);

  assert.equal(normalizeRelPath('a\\b\\c'), 'a/b/c');
  assert.equal(safeFileName('a<b>:c|d?e*f'), 'a_b__c_d_e_f');
});

test('utils: file helpers create, detect, and discover files', async () => {
  await withTempCwd(async (cwd) => {
    const nested = path.join(cwd, 'deep', 'folder', 'file.txt');
    await writeFileEnsured(nested, 'hello');

    assert.equal(await fileExists(nested), true);
    assert.equal(await readText(nested), 'hello');

    const jsonPath = path.join(cwd, 'data.json');
    await writeJson(jsonPath, { ok: true, value: 7 });
    assert.deepEqual(await readJson(jsonPath), { ok: true, value: 7 });

    assert.equal(
      await fileExistsAny([
        path.join(cwd, 'missing'),
        nested,
        path.join(cwd, 'other'),
      ]),
      nested
    );

    const found = await findFiles(cwd, (abs, rel) => rel.endsWith('.txt'));
    assert.equal(found.length, 1);
    assert.match(found[0].rel, /file\.txt$/);
  });
});

test('utils: templateExists recognizes Gradle wrapper scaffolding', async () => {
  await withTempCwd(async (cwd) => {
    await writeFileEnsured(path.join(cwd, 'gradlew'), '#!/bin/sh\n');
    await writeFileEnsured(path.join(cwd, 'gradle', 'wrapper', 'gradle-wrapper.jar'), 'jar');
    await writeFileEnsured(
      path.join(cwd, 'gradle', 'wrapper', 'gradle-wrapper.properties'),
      'distributionUrl=https://services.gradle.org/distributions/gradle-8.10.2-bin.zip\n'
    );

    assert.equal(await templateExists(cwd), true);
  });
});

// -----------------------------------------------------------------------------
// constants / templates
// -----------------------------------------------------------------------------

test('constants: supported templates stay in sync with built-in registry', () => {
  const registryNames = templateNames();
  for (const name of SUPPORTED_TEMPLATES) {
    assert.equal(registryNames.includes(name), true, `missing template: ${name}`);
  }
  assert.ok(SUPPORTED_TEMPLATES.includes(DEFAULTS.template));
});

// -----------------------------------------------------------------------------
// config
// -----------------------------------------------------------------------------

test('config: loads JSON, ESM, and CommonJS configuration files', async () => {
  await withTempCwd(async (cwd) => {
    await writeJson(path.join(cwd, 'japkgen.config.json'), {
      japkgen: {
        defaults: {
          name: 'JSON App',
          package: 'com.example.json',
          template: 'react',
        },
      },
    });

    const jsonConfig = await loadProjectConfig(cwd);
    assert.equal(jsonConfig.path, path.join(cwd, 'japkgen.config.json'));
    assert.equal(jsonConfig.defaults.name, 'JSON App');
    assert.equal(jsonConfig.defaults.package, 'com.example.json');
    assert.equal(jsonConfig.defaults.template, 'react');

    await fs.rm(path.join(cwd, 'japkgen.config.json'));
    await writeFileEnsured(
      path.join(cwd, 'japkgen.config.mjs'),
      [
        'export default {',
        '  defaults: {',
        '    name: "ESM App",',
        '    package: "com.example.esm",',
        '    template: "kotlin"',
        '  }',
        '};',
        '',
      ].join('\n')
    );

    const esmConfig = await loadProjectConfig(cwd);
    assert.equal(esmConfig.defaults.name, 'ESM App');
    assert.equal(esmConfig.defaults.package, 'com.example.esm');
    assert.equal(esmConfig.defaults.template, 'kotlin');

    await fs.rm(path.join(cwd, 'japkgen.config.mjs'));
    await writeFileEnsured(
      path.join(cwd, 'japkgen.config.js'),
      [
        'module.exports = {',
        '  defaults: {',
        '    name: "CJS App",',
        '    package: "com.example.cjs",',
        '    template: "compose"',
        '  }',
        '};',
        '',
      ].join('\n')
    );

    const cjsConfig = await loadProjectConfig(cwd);
    assert.equal(cjsConfig.defaults.name, 'CJS App');
    assert.equal(cjsConfig.defaults.package, 'com.example.cjs');
    assert.equal(cjsConfig.defaults.template, 'compose');
  });
});

test('config: returns an empty normalized config when nothing exists', async () => {
  await withTempCwd(async (cwd) => {
    const config = await loadProjectConfig(cwd);
    assert.equal(config.path, null);
    assert.deepEqual(config.defaults, {});
    assert.deepEqual(config.templates, {});
    assert.deepEqual(config.plugins, []);
  });
});

// -----------------------------------------------------------------------------
// plugins
// -----------------------------------------------------------------------------

test('plugins: loads plugin files, templates, and hooks from multiple sources', async () => {
  await withTempCwd(async (cwd) => {
    await writeFileEnsured(
      path.join(cwd, 'japkgen.plugins.mjs'),
      [
        'export default {',
        '  name: "root-plugin",',
        '  templates: {',
        '    RootTemplate: { factory: () => ({ files: { "README.md": "root" } }) }',
        '  },',
        '  beforeGenerate: [(ctx) => { ctx.touched = (ctx.touched || []).concat("root-before"); }],',
        '  afterGenerate: (ctx) => { ctx.touched = (ctx.touched || []).concat("root-after"); }',
        '};',
        '',
      ].join('\n')
    );

    await writeJson(path.join(cwd, 'package.json'), {
      name: 'plugin-host',
      japkgen: {
        plugins: ['./extra-plugin.mjs'],
      },
    });

    await writeFileEnsured(
      path.join(cwd, 'extra-plugin.mjs'),
      [
        'export default {',
        '  name: "extra-plugin",',
        '  templates: {',
        '    ExtraTemplate: { factory: () => ({ files: { "EXTRA.txt": "ok" } }) }',
        '  },',
        '  beforeWrite: [(ctx) => { ctx.touched = (ctx.touched || []).concat("extra-before-write"); }],',
        '  afterWrite: [(ctx) => { ctx.touched = (ctx.touched || []).concat("extra-after-write"); }]',
        '};',
        '',
      ].join('\n')
    );

    const bundle = await loadPlugins(cwd);

    assert.ok(bundle.plugins.length >= 2);
    assert.ok(bundle.hooks.beforeGenerate.length >= 1);
    assert.ok(bundle.hooks.beforeWrite.length >= 1);
    assert.ok(bundle.hooks.afterWrite.length >= 1);
    assert.ok(bundle.hooks.afterGenerate.length >= 1);

    const templateKeys = Object.keys(bundle.templates || {});
    assert.ok(templateKeys.length >= 2);

    const context = { touched: [] };
    await runHooks(bundle.hooks.beforeGenerate, context);
    await runHooks(bundle.hooks.beforeWrite, context);
    await runHooks(bundle.hooks.afterWrite, context);
    await runHooks(bundle.hooks.afterGenerate, context);

    assert.ok(context.touched.includes('root-before'));
    assert.ok(context.touched.includes('root-after'));
    assert.ok(context.touched.includes('extra-before-write'));
    assert.ok(context.touched.includes('extra-after-write'));
  });
});

// -----------------------------------------------------------------------------
// signing
// -----------------------------------------------------------------------------

test('signing: sanitizes aliases and writes keystore.properties', async () => {
  await withTempCwd(async (cwd) => {
    assert.equal(sanitizeAlias(' Release Alias! '), 'Release_Alias_');
    assert.equal(sanitizeAlias(''), DEFAULTS.keystoreAlias);

    const result = await writeSigningFiles(cwd, {
      signingEnabled: true,
      keystore: './release.keystore',
      keyAlias: 'release',
      storePassword: 'storepass',
      keyPassword: 'keypass',
    });

    assert.equal(result, path.join(cwd, 'keystore.properties'));
    const content = await read(result);
    assert.match(content, /storeFile=\.\/release\.keystore/);
    assert.match(content, /storePassword=storepass/);
    assert.match(content, /keyAlias=release/);
    assert.match(content, /keyPassword=keypass/);
  });
});

// -----------------------------------------------------------------------------
// dependency manager
// -----------------------------------------------------------------------------

test('dependency-manager: lists, adds, and removes Gradle dependencies', async () => {
  await withTempCwd(async (cwd) => {
    await createMinimalProject(cwd);

    const initial = await listProjectDependencies(cwd);
    assert.deepEqual(initial, [
      { scope: 'implementation', dependency: 'androidx.core:core-ktx:1.13.1' },
      { scope: 'implementation', dependency: 'androidx.appcompat:appcompat:1.7.0' },
    ]);

    const addResult = await addProjectDependency(
      cwd,
      'com.squareup.okhttp3:okhttp:4.12.0',
      'implementation'
    );
    assert.equal(addResult.updated, true);

    const afterAdd = await listProjectDependencies(cwd);
    assert.equal(
      afterAdd.some((dep) => dep.dependency === 'com.squareup.okhttp3:okhttp:4.12.0'),
      true
    );

    const addAgain = await addProjectDependency(
      cwd,
      'com.squareup.okhttp3:okhttp:4.12.0',
      'implementation'
    );
    assert.equal(addAgain.updated, false);

    const removeResult = await removeProjectDependency(cwd, 'com.squareup.okhttp3:okhttp:4.12.0');
    assert.equal(removeResult.removed, true);

    const afterRemove = await listProjectDependencies(cwd);
    assert.equal(
      afterRemove.some((dep) => dep.dependency === 'com.squareup.okhttp3:okhttp:4.12.0'),
      false
    );

    const listed = await runDependencyManager(cwd, { action: 'list' });
    assert.equal(listed.dependencies.length >= 2, true);

    const addViaRunner = await runDependencyManager(cwd, {
      action: 'add',
      dependency: 'androidx.lifecycle:lifecycle-runtime-ktx:2.8.7',
      scope: 'implementation',
    });
    assert.equal(addViaRunner.updated, true);

    const removeViaRunner = await runDependencyManager(cwd, {
      action: 'remove',
      dependency: 'androidx.lifecycle:lifecycle-runtime-ktx:2.8.7',
    });
    assert.equal(removeViaRunner.removed, true);
  });
});

// -----------------------------------------------------------------------------
// project tester
// -----------------------------------------------------------------------------

test('project tester: validates a minimal Android project layout', async () => {
  await withTempCwd(async (cwd) => {
    const { appDir, mainDir } = await createMinimalProject(cwd);
    const report = await runProjectTests(cwd);

    assert.equal(report.ok, true);
    assert.equal(report.projectDir, path.resolve(cwd));
    assert.ok(report.checks.length >= 4);
    assert.equal(isLikelyWebUrl('https://example.com'), true);
    assert.equal(isLikelyWebUrl('file:///tmp'), false);

    assert.equal(await exists(path.join(appDir, 'build.gradle')), true);
    assert.equal(await exists(path.join(mainDir, 'AndroidManifest.xml')), true);
  });
});

// -----------------------------------------------------------------------------
// generator
// -----------------------------------------------------------------------------

const PACKAGE = 'com.example.japkgen';

const GENERATED_CASES = [
  {
    template: 'webview',
    name: 'WebView Sample',
    packageName: `${PACKAGE}.webview`,
    check: async (projectDir) => {
      const manifest = await read(path.join(projectDir, 'app', 'src', 'main', 'AndroidManifest.xml'));
      assert.match(manifest, /android\.permission\.INTERNET/);
      assert.equal(await hasWebFiles(projectDir), true);
      const manifestExists = await exists(
        path.join(projectDir, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
      assert.equal(manifestExists, true);
    },
  },
  {
    template: 'pwa',
    name: 'PWA Sample',
    packageName: `${PACKAGE}.pwa`,
    check: async (projectDir) => {
      const manifest = await read(path.join(projectDir, 'app', 'src', 'main', 'AndroidManifest.xml'));
      assert.match(manifest, /android\.permission\.INTERNET/);
      assert.equal(await hasWebFiles(projectDir), true);
      const manifestExists = await exists(
        path.join(projectDir, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
      assert.equal(manifestExists, true);
    },
  },
  {
    template: 'react',
    name: 'React Sample',
    packageName: `${PACKAGE}.react`,
    check: async (projectDir) => {
      const packageJsonFiles = await findFiles(projectDir, (abs, rel) => rel.endsWith('package.json'));
      assert.ok(packageJsonFiles.length > 0);
      assert.equal(await hasWebFiles(projectDir), true);
      assert.equal(await hasAndroidSource(projectDir), true);
    },
  },
  {
    template: 'kotlin',
    name: 'Kotlin Sample',
    packageName: `${PACKAGE}.kotlin`,
    check: async (projectDir) => {
      const kotlinFiles = await findFiles(
        path.join(projectDir, 'app', 'src', 'main'),
        (abs, rel) => /\.(kt)$/i.test(rel)
      );
      assert.ok(kotlinFiles.length > 0);
      assert.equal(await hasAndroidSource(projectDir), true);
    },
  },
  {
    template: 'compose',
    name: 'Compose Sample',
    packageName: `${PACKAGE}.compose`,
    check: async (projectDir) => {
      const kotlinFiles = await findFiles(
        path.join(projectDir, 'app', 'src', 'main'),
        (abs, rel) => /\.(kt)$/i.test(rel)
      );
      assert.ok(kotlinFiles.length > 0);

      const firstKt = await read(kotlinFiles[0].abs);
      assert.match(firstKt, /setContent|Compose|MaterialTheme/i);
    },
  },
  {
    template: 'c',
    name: 'C Sample',
    packageName: `${PACKAGE}.c`,
    check: async (projectDir) => {
      assert.equal(await hasNativeFiles(projectDir), true);
      assert.equal(await hasAndroidSource(projectDir), true);
    },
  },
  {
    template: 'cpp',
    name: 'Cpp Sample',
    packageName: `${PACKAGE}.cpp`,
    check: async (projectDir) => {
      assert.equal(await hasNativeFiles(projectDir), true);
      assert.equal(await hasAndroidSource(projectDir), true);
    },
  },
  {
    template: 'game-java',
    name: 'Game Java Sample',
    packageName: `${PACKAGE}.gamejava`,
    check: async (projectDir) => {
      assert.equal(await hasAndroidSource(projectDir), true);
      const readme = await read(path.join(projectDir, 'README.md'));
      assert.match(readme, /game/i);
    },
  },
  {
    template: 'game-cpp',
    name: 'Game Cpp Sample',
    packageName: `${PACKAGE}.gamecpp`,
    check: async (projectDir) => {
      assert.equal(await hasNativeFiles(projectDir), true);
      assert.equal(await hasAndroidSource(projectDir), true);
    },
  },
];

for (const { template, name, packageName, check } of GENERATED_CASES) {
  test(`generator: produces a valid ${template} project`, async () => {
    await assertGeneratedTemplate({
      template,
      name,
      packageName,
      checks: async (projectDir) => {
        const readme = await read(path.join(projectDir, 'README.md'));
        const settings = await read(path.join(projectDir, 'settings.gradle'));
        const buildGradle = await read(path.join(projectDir, 'build.gradle'));
        const manifest = await read(path.join(projectDir, 'app', 'src', 'main', 'AndroidManifest.xml'));

        assert.match(readme, /#|JAPKGEN|Android/i);
        assert.match(settings, /rootProject\.name|include ':app'/i);
        assert.match(buildGradle, /compileSdk|dependencies|android/i);
        assert.match(manifest, /<manifest/i);

        await check(projectDir, packageName);
      },
    });
  });
}

test('generator: respects config defaults and the built-in project tester', async () => {
  await withTempCwd(async (cwd) => {
    await writeJson(path.join(cwd, 'japkgen.config.json'), {
      defaults: {
        name: 'Config Driven App',
        package: 'com.example.configdriven',
        template: 'kotlin',
        minSdk: 24,
        targetSdk: 34,
        compileSdk: 34,
        url: 'https://example.com',
      },
    });

    const result = await generateProject({ noPrompt: true });
    assert.match(result.projectDir, /Config Driven App$/);
    assert.equal(result.templateName, 'kotlin');

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
          template: 'does-not-exist',
        }),
      /Unknown template/i
    );
  });
});