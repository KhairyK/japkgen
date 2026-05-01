import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import fs from 'fs-extra';
import { fileExistsAny, getDefaultAndroidSdkPaths } from './utils.js';
import /**
 * @typedef {import('./types.js').EnvironmentInfo} EnvironmentInfo
 */ './types.js';

async function runVersionCheck(cmd, args) {
  try {
    const result = await execa(cmd, args, { reject: false });
    return {
      ok: result.exitCode === 0,
      output: String(result.stderr || result.stdout || '').trim()
    };
  } catch (error) {
    return {
      ok: false,
      output: String(error?.message || error)
    };
  }
}

/**
 * Detect environment Android dev
 *
 * @returns {Promise<EnvironmentInfo>}
 */
export async function detectEnvironment() {
  const env = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    home: os.homedir(),
    java: await runVersionCheck('java', ['-version']),
    gradle: await runVersionCheck('gradle', ['-v']),
    adb: await runVersionCheck('adb', ['version']),
    sdkRoot:
      process.env.ANDROID_SDK_ROOT ||
      process.env.ANDROID_HOME ||
      (await fileExistsAny(getDefaultAndroidSdkPaths())),
    hasWrapper: false
  };

  if (env.sdkRoot) {
    const sdkPath = path.resolve(env.sdkRoot);
    env.sdkRoot = sdkPath;
    env.hasSdkRoot = await fs.pathExists(sdkPath);
    env.sdkPlatformTools = await fs.pathExists(path.join(sdkPath, 'platform-tools'));
    env.sdkBuildTools = await fs.pathExists(path.join(sdkPath, 'build-tools'));
  } else {
    env.hasSdkRoot = false;
    env.sdkPlatformTools = false;
    env.sdkBuildTools = false;
  }

  return env;
}