import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import fs from 'fs-extra';
import ora from 'ora';
import pc from 'picocolors';
import { execa } from 'execa';

import { DEFAULTS } from './constants.js';
import { normalizePathValue, templateExists, writeFileEnsured } from './utils.js';
import /**
 * @typedef {import('./types.js').BuildOptions} BuildOptions
 */ './types.js';

async function bootstrapGradleWrapper(projectDir, gradleVersion) {
  if (await templateExists(projectDir)) return;

  const gradleBin = process.platform === 'win32' ? 'gradle.bat' : 'gradle';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'japkgen-wrapper-'));

  const spinner = ora(`Bootstrapping Gradle wrapper ${gradleVersion}`).start();

  try {
    await writeFileEnsured(
      path.join(tempDir, 'settings.gradle'),
      `rootProject.name = 'wrapper-bootstrap'\n`
    );
    await writeFileEnsured(path.join(tempDir, 'build.gradle'), `\n`);

    await execa(
      gradleBin,
      ['wrapper', '--gradle-version', String(gradleVersion), '--distribution-type', 'bin'],
      {
        cwd: tempDir,
        stdio: 'inherit'
      }
    );

    await fs.ensureDir(path.join(projectDir, 'gradle', 'wrapper'));

    const copies = [
      ['gradlew', 'gradlew'],
      ['gradlew.bat', 'gradlew.bat'],
      ['gradle/wrapper/gradle-wrapper.jar', 'gradle/wrapper/gradle-wrapper.jar'],
      ['gradle/wrapper/gradle-wrapper.properties', 'gradle/wrapper/gradle-wrapper.properties']
    ];

    for (const [srcRel, dstRel] of copies) {
      await fs.copy(path.join(tempDir, srcRel), path.join(projectDir, dstRel), { overwrite: true });
    }

    if (process.platform !== 'win32') {
      await fs.chmod(path.join(projectDir, 'gradlew'), 0o755);
    }

    spinner.succeed('Gradle wrapper ready');
  } catch (error) {
    spinner.fail('Failed to bootstrap Gradle wrapper');
    throw error;
  } finally {
    await fs.remove(tempDir);
  }
}

async function ensureLocalProperties(projectDir) {
  const androidSdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!androidSdkRoot) return;

  const localPropsPath = path.join(projectDir, 'local.properties');
  const content = `sdk.dir=${normalizePathValue(androidSdkRoot)}\n`;
  await writeFileEnsured(localPropsPath, content);
}

/**
 * Build APK project
 *
 * @param {string} projectDirArg
 * @param {BuildOptions} buildOptions
 *
 * @returns {Promise<void>}
 *
 * @example
 * await buildProject('./app', { variant: 'release' })
 */
export async function buildProject(projectDirArg, buildOptions) {
  const projectDir = path.resolve(projectDirArg || process.cwd());
  const variant = String(buildOptions.variant || 'debug').toLowerCase();

  if (!(await fs.pathExists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  await ensureLocalProperties(projectDir);

  const spinner = ora(`Preparing build (${variant})`).start();

  try {
    await bootstrapGradleWrapper(projectDir, buildOptions.gradleVersion || DEFAULTS.gradleVersion);

    const isWindows = process.platform === 'win32';
    const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
    const task = variant === 'release' ? 'assembleRelease' : 'assembleDebug';

    spinner.text = `Running ${task}`;

    await execa(gradlew, [task], {
      cwd: projectDir,
      stdio: 'inherit',
      shell: isWindows
    });

    spinner.succeed(`Build complete: ${task}`);

    const apkPath =
      variant === 'release'
        ? path.join(projectDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
        : path.join(projectDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

    console.log(pc.green(`APK path: ${apkPath}`));
  } catch (error) {
    spinner.fail('Build failed');
    throw error;
  }
}