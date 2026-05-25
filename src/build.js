import path from "node:path";
import { DEFAULTS } from "./constants.js";
import { debugLog } from "./debug.js";
import { logger } from "./logger.js";
import {
  detectCommand,
  fileExists,
  readJson,
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
      "Global Gradle was not found, so the wrapper could not be bootstrapped automatically."
    );
  }
  const cmd = process.platform === "win32" ? "gradle.bat" : "gradle";
  const result = await runCommand(cmd, [
    "wrapper",
    "--gradle-version",
    String(gradleVersion || DEFAULTS.gradleVersion),
    "--distribution-type",
    "bin",
  ], {
    cwd: projectDir,
    stdio: "inherit",
    reject: false,
  });
  if (!result.ok) {
    throw new Error(result.stderr || result.stdout || "Failed to bootstrap the Gradle wrapper.");
  }
  return true;
}

async function readProjectMeta(projectDir) {
  const metaPath = path.join(projectDir, "japkgen.meta.json");
  if (!(await fileExists(metaPath))) return null;
  return readJson(metaPath, null);
}

async function runGradleBuild(projectDir, variant, gradleVersion) {
  if (!(await templateExists(projectDir))) {
    logger.warn("Gradle wrapper was not found. Attempting to bootstrap it...");
    await bootstrapGradleWrapper(projectDir, gradleVersion);
  }

  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  const task = variant === "release" ? "assembleRelease" : "assembleDebug";
  const result = await runCommand(gradlew, [task], {
    cwd: projectDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    reject: false,
  });
  if (!result.ok) {
    throw new Error(result.stderr || result.stdout || "Build failed.");
  }

  return {
    apkPath:
      variant === "release"
        ? path.join(projectDir, "app", "build", "outputs", "apk", "release", "app-release.apk")
        : path.join(projectDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    variant,
  };
}

export async function buildProject(projectDirArg, buildOptions = {}) {
  const projectDir = path.resolve(projectDirArg || process.cwd());
  const variant = String(buildOptions.variant || DEFAULTS.variant).toLowerCase();
  const meta = await readProjectMeta(projectDir);
  const templateKind = String(meta?.templateKind || "android").toLowerCase();

  if (!(await fileExists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  logger.title("JAPKGEN Build");
  logger.info(`Project: ${projectDir}`);
  logger.info(`Variant: ${variant}`);
  if (meta?.templateName) {
    logger.info(`Template: ${meta.templateName}`);
  }
  debugLog("build", "Resolved build options", { projectDir, variant, meta });

  await ensureLocalProperties(projectDir);

  if (templateKind === "flutter") {
    const flutterExists = await detectCommand("flutter", ["--version"]);
    if (!flutterExists) {
      throw new Error("Flutter CLI was not found on this system.");
    }
    const result = await runCommand("flutter", ["build", "apk", variant === "release" ? "--release" : "--debug"], {
      cwd: projectDir,
      stdio: "inherit",
      reject: false,
    });
    if (!result.ok) {
      throw new Error(result.stderr || result.stdout || "Flutter build failed.");
    }
    const apkPath = path.join(projectDir, "build", "app", "outputs", "flutter-apk", `app-${variant}.apk`);
    logger.success(`Build completed: flutter build apk (${variant})`);
    logger.bullet("APK path", apkPath);
    return { apkPath, variant };
  }

  if (templateKind === "react-native") {
    const androidDir = path.join(projectDir, "android");
    if (await fileExists(androidDir)) {
      await ensureLocalProperties(androidDir);
    }
    const buildRoot = (await fileExists(androidDir)) ? androidDir : projectDir;
    const result = await runGradleBuild(buildRoot, variant, buildOptions.gradleVersion || DEFAULTS.gradleVersion);
    logger.success(`Build completed: React Native Android packaging (${variant})`);
    return result;
  }

  const result = await runGradleBuild(projectDir, variant, buildOptions.gradleVersion || DEFAULTS.gradleVersion);
  logger.success(`Build completed: assemble${variant === "release" ? "Release" : "Debug"}`);
  logger.bullet("APK path", result.apkPath);
  return result;
}
