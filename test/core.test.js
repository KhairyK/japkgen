import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { inspect } from 'node:util';
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

const LOGS_DIR = path.resolve('logs');

async function ensureLogsDir() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

function createLogId(title) {
  return crypto
    .createHash('sha1')
    .update(`${title}-${Date.now()}-${Math.random()}`)
    .digest('hex')
    .slice(0, 12);
}

async function writeTestLog(title, content) {
  await ensureLogsDir();

  const hash = createLogId(title);
  const safeTitle = safeFileName(title.toLowerCase().replace(/\s+/g, '-'));
  const filePath = path.join(LOGS_DIR, `testfile-${safeTitle}-${hash}.log`);

  await fs.writeFile(
    filePath,
    [
      `# TEST LOG`,
      `TITLE: ${title}`,
      `TIME: ${new Date().toISOString()}`,
      '',
      typeof content === 'string'
        ? content
        : inspect(content, {
            depth: Infinity,
            colors: false,
            compact: false
          })
    ].join('\n'),
    'utf8'
  );

  return filePath;
}

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

async function assertGeneratedTemplate({
  template,
  name,
  packageName,
  checks
}) {
  await withTempCwd(async () => {
    const startedAt = Date.now();

    try {
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

      const endedAt = Date.now();

      await writeTestLog(
        `PASS-${template}`,
        {
          status: 'PASS',
          template,
          projectDir: result.projectDir,
          durationMs: endedAt - startedAt
        }
      );
    } catch (error) {
      const endedAt = Date.now();

      await writeTestLog(
        `FAIL-${template}`,
        {
          status: 'FAIL',
          template,
          durationMs: endedAt - startedAt,
          error: {
            name: error?.name,
            message: error?.message,
            stack: error?.stack
          }
        }
      );

      throw error;
    }
  });
}

test(
  'generator: creates native C and C++ templates with CMake and Make scaffolding',
  async () => {
    await assertGeneratedTemplate({
      template: 'c',
      name: 'C Sample',
      packageName: 'com.example.csample',
      checks: async (projectDir) => {
        assert.equal(
          await exists(
            path.join(
              projectDir,
              'app',
              'src',
              'main',
              'cpp',
              'CMakeLists.txt'
            )
          ),
          true
        );

        assert.equal(
          await exists(
            path.join(
              projectDir,
              'app',
              'src',
              'main',
              'cpp',
              'native-lib.c'
            )
          ),
          true
        );

        assert.equal(
          await exists(path.join(projectDir, 'Makefile')),
          true
        );

        const readme = await read(
          path.join(projectDir, 'README.md')
        );

        assert.match(readme, /CMake/i);
        assert.match(readme, /Makefile/i);
      }
    });

    await assertGeneratedTemplate({
      template: 'cpp',
      name: 'Cpp Sample',
      packageName: 'com.example.cppsample',
      checks: async (projectDir) => {
        assert.equal(
          await exists(
            path.join(
              projectDir,
              'app',
              'src',
              'main',
              'cpp',
              'CMakeLists.txt'
            )
          ),
          true
        );

        assert.equal(
          await exists(
            path.join(
              projectDir,
              'app',
              'src',
              'main',
              'cpp',
              'native-lib.cpp'
            )
          ),
          true
        );

        assert.equal(
          await exists(path.join(projectDir, 'Makefile')),
          true
        );
      }
    });
  }
);

test(
  'generator: creates a native C/C++ game template with CMake integration',
  async () => {
    await assertGeneratedTemplate({
      template: 'game-cpp',
      name: 'Game Cpp Sample',
      packageName: 'com.example.gamecppsample',

      checks: async (projectDir) => {
        const cppDir = path.join(
          projectDir,
          'app',
          'src',
          'main',
          'cpp'
        );

        assert.equal(
          await exists(path.join(cppDir, 'CMakeLists.txt')),
          true
        );

        assert.equal(
          await exists(path.join(cppDir, 'native-lib.cpp')),
          true
        );

        const cmake = await read(
          path.join(cppDir, 'CMakeLists.txt')
        );

        assert.match(
          cmake,
          /project\("japkgen_game".*\)/i
        );

        assert.match(cmake, /native-lib/);

        const mainActivity = await read(
          path.join(
            projectDir,
            sourceFilePath(
              'com.example.gamecppsample',
              'java',
              'MainActivity.java'
            )
          )
        );

        assert.match(
          mainActivity,
          /System\.loadLibrary\("native-lib"\)/
        );
      }
    });
  }
);

test(
  'generator: supports config-driven defaults and can run the built-in project tester',
  async () => {
    await withTempCwd(async () => {
      try {
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

        const result = await generateProject({
          noPrompt: true
        });

        assert.match(
          result.projectDir,
          /Config Driven App$/
        );

        assert.equal(
          await exists(
            path.join(result.projectDir, 'README.md')
          ),
          true
        );

        const report = await runProjectTests(
          result.projectDir
        );

        assert.equal(report.ok, true);
        assert.ok(report.checks.length > 0);

        await writeTestLog(
          'config-driven-project-test',
          report
        );
      } catch (error) {
        await writeTestLog(
          'config-driven-project-test-fail',
          {
            error: {
              name: error?.name,
              message: error?.message,
              stack: error?.stack
            }
          }
        );

        throw error;
      }
    });
  }
);

test(
  'generator: rejects unknown templates with a clear error',
  async () => {
    await withTempCwd(async () => {
      try {
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

        await writeTestLog(
          'unknown-template-test',
          'Unknown template rejection passed.'
        );
      } catch (error) {
        await writeTestLog(
          'unknown-template-test-fail',
          {
            error: {
              name: error?.name,
              message: error?.message,
              stack: error?.stack
            }
          }
        );

        throw error;
      }
    });
  }
);