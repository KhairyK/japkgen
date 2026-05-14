import path from "node:path";
import { DEFAULTS } from "./constants.js";
import { debugLog } from "./debug.js";
import { logger } from "./logger.js";
import {
  fileExists,
  runCommand,
  templateExists,
  writeFileEnsured,
} from "./utils.js";

async function ensureLocalProperties(projectDir) {
  const androidSdkRoot =
    process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!androidSdkRoot) return false;
  const localPropsPath = path.join(projectDir, "local.properties");
  const content = `sdk.dir=${String(androidSdkRoot).replaceAll("\\", "/")}\n`;
  await writeFileEnsured(localPropsPath, content);
  return true;
}

async function bootstrapGradleWrapper(projectDir, gradleVersion) {
  if (await templateExists(projectDir)) return true;
  const gradleExists = await runCommand(
    process.platform === "win32" ? "gradle.bat" : "gradle",
    ["-v"],
    { reject: false }
  );
  if (!gradleExists.ok) {
    throw new Error(
      "Global Gradle not found, cannot bootstrap wrapper automatically."
    );
  }
  const cmd = process.platform === "win32" ? "gradle.bat" : "gradle";
  const args = [
    "wrapper",
    "--gradle-version",
    String(gradleVersion || DEFAULTS.gradleVersion),
    "--distribution-type",
    "bin",
  ];
  const result = await runCommand(cmd, args, {
    cwd: projectDir,
    stdio: "inherit",
    reject: false,
  });
  if (!result.ok)
    throw new Error(
      result.stderr || result.stdout || "failed to bootstrap Gradle wrapper."
    );
  return true;
}

export async function buildProject(projectDirArg, buildOptions = {}) {
  const projectDir = path.resolve(projectDirArg || process.cwd());
  const variant = String(
    buildOptions.variant || DEFAULTS.variant
  ).toLowerCase();
  const task = variant === "release" ? "assembleRelease" : "assembleDebug";

  if (!(await fileExists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  logger.title("JAPKGEN Build");
  logger.info(`Project: ${projectDir}`);
  logger.info(`Variant: ${variant}`);
  debugLog("build", "Resolved build options", { projectDir, variant, task });

  await ensureLocalProperties(projectDir);

  if (!(await templateExists(projectDir))) {
    logger.warn("Gradle wrapper not found. Trying to bootstrap...");
    await bootstrapGradleWrapper(
      projectDir,
      buildOptions.gradleVersion || DEFAULTS.gradleVersion
    );
  }

  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  const result = await runCommand(gradlew, [task], {
    cwd: projectDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    reject: false,
  });
  if (!result.ok) {
    throw new Error(result.stderr || result.stdout || "Build gagal.");
  }

  const apkPath =
    variant === "release"
      ? path.join(
          projectDir,
          "app",
          "build",
          "outputs",
          "apk",
          "release",
          "app-release.apk"
        )
      : path.join(
          projectDir,
          "app",
          "build",
          "outputs",
          "apk",
          "debug",
          "app-debug.apk"
        );

  logger.success(`Build selesai: ${task}`);
  logger.bullet("APK path", apkPath);
  return { apkPath, variant };
}
