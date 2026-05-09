import os from "node:os";
import path from "node:path";
import { DEFAULTS } from "./constants.js";
import { detectCommand, fileExistsAny, getDefaultAndroidSdkPaths } from "./utils.js";

async function runVersionCheck(command, args) {
  try {
    const ok = await detectCommand(command, args);
    if (!ok) return { ok: false, output: "" };
    const { runCommand } = await import("./utils.js");
    const result = await runCommand(command, args, { reject: false });
    return {
      ok: result.ok,
      output: String((result.stderr || result.stdout || "").trim())
    };
  } catch (error) {
    return {
      ok: false,
      output: String(error?.message || error || "")
    };
  }
}

export async function detectEnvironment() {
  const sdkRoot =
    process.env.ANDROID_SDK_ROOT ||
    process.env.ANDROID_HOME ||
    (await fileExistsAny(getDefaultAndroidSdkPaths()));

  const env = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    home: os.homedir(),
    java: await runVersionCheck("java", ["-version"]),
    gradle: await runVersionCheck("gradle", ["-v"]),
    adb: await runVersionCheck("adb", ["version"]),
    sdkRoot: sdkRoot ? path.resolve(sdkRoot) : null,
    hasSdkRoot: false,
    sdkPlatformTools: false,
    sdkBuildTools: false,
    gradleWrapper: false,
    recommendedJava: DEFAULTS.javaVersion
  };

  if (env.sdkRoot) {
    env.hasSdkRoot = true;
    env.sdkPlatformTools = await fileExistsAny([path.join(env.sdkRoot, "platform-tools")]);
    env.sdkBuildTools = await fileExistsAny([path.join(env.sdkRoot, "build-tools")]);
  }

  return env;
}
