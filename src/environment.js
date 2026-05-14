import os from "node:os";
import path from "node:path";
import { DEFAULTS } from "./constants.js";
import {
  detectCommand,
  fileExistsAny,
  getDefaultAndroidSdkPaths,
} from "./utils.js";

async function runVersionCheck(command, args) {
  try {
    const ok = await detectCommand(command, args);
    if (!ok) return { ok: false, output: "" };
    const { runCommand } = await import("./utils.js");
    const result = await runCommand(command, args, { reject: false });
    return {
      ok: result.ok,
      output: String((result.stderr || result.stdout || "").trim()),
    };
  } catch (error) {
    return {
      ok: false,
      output: String(error?.message || error || ""),
    };
  }
}

export async function detectEnvironment() {
  const sdkRootCandidate =
    process.env.ANDROID_SDK_ROOT ||
    process.env.ANDROID_HOME ||
    (await fileExistsAny(getDefaultAndroidSdkPaths()));

  const env = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    home: os.homedir(),
    javaHome: process.env.JAVA_HOME || null,
    androidHome: process.env.ANDROID_HOME || null,
    androidSdkRoot: process.env.ANDROID_SDK_ROOT || null,
    packageManagers: {
      npm: await runVersionCheck("npm", ["--version"]),
      pnpm: await runVersionCheck("pnpm", ["--version"]),
      yarn: await runVersionCheck("yarn", ["--version"]),
    },
    java: await runVersionCheck("java", ["-version"]),
    gradle: await runVersionCheck("gradle", ["-v"]),
    adb: await runVersionCheck("adb", ["version"]),
    sdkRoot: sdkRootCandidate ? path.resolve(sdkRootCandidate) : null,
    hasSdkRoot: false,
    sdkPlatformTools: null,
    sdkBuildTools: null,
    gradleWrapper: false,
    recommendedJava: DEFAULTS.javaVersion,
    git: await runVersionCheck("git", ["--version"]),
  };

  if (env.sdkRoot) {
    env.hasSdkRoot = true;
    env.sdkPlatformTools =
      (await fileExistsAny([path.join(env.sdkRoot, "platform-tools")])) || null;
    env.sdkBuildTools =
      (await fileExistsAny([path.join(env.sdkRoot, "build-tools")])) || null;
  }

  return env;
}
