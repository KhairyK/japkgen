import path from "node:path";
import { detectEnvironment } from "./environment.js";
import { logger } from "./logger.js";
import { fileExists } from "./utils.js";

function tick(ok) {
  return ok ? "✔" : "✖";
}

export async function runDoctor() {
  const env = await detectEnvironment();

  logger.title("JAPKGEN Doctor");
  logger.bullet("Platform", `${env.platform} (${env.arch})`);
  logger.bullet("Node", env.node);
  logger.bullet(
    "npm",
    `${tick(env.packageManagers.npm.ok)} ${env.packageManagers.npm.ok ? env.packageManagers.npm.output || "found" : "missing"}`
  );
  logger.bullet(
    "pnpm",
    `${tick(env.packageManagers.pnpm.ok)} ${env.packageManagers.pnpm.ok ? env.packageManagers.pnpm.output || "found" : "missing"}`
  );
  logger.bullet(
    "yarn",
    `${tick(env.packageManagers.yarn.ok)} ${env.packageManagers.yarn.ok ? env.packageManagers.yarn.output || "found" : "missing"}`
  );
  logger.bullet(
    "Java",
    `${tick(env.java.ok)} ${env.java.ok ? env.java.output || "found" : "missing"}`
  );
  logger.bullet(
    "Gradle",
    `${tick(env.gradle.ok)} ${env.gradle.ok ? env.gradle.output || "found" : "missing"}`
  );
  logger.bullet(
    "ADB",
    `${tick(env.adb.ok)} ${env.adb.ok ? env.adb.output || "found" : "missing"}`
  );
  logger.bullet(
    "Git",
    `${tick(env.git.ok)} ${env.git.ok ? env.git.output || "found" : "missing"}`
  );
  logger.bullet("Java home", env.javaHome || "not set");
  logger.bullet("Android SDK", env.sdkRoot || "not found");
  logger.bullet(
    "platform-tools",
    env.sdkPlatformTools ? `✔ ${env.sdkPlatformTools}` : "✖ missing"
  );
  logger.bullet(
    "build-tools",
    env.sdkBuildTools ? `✔ ${env.sdkBuildTools}` : "✖ missing"
  );

  const hasWrapper =
    (await fileExists(path.join(process.cwd(), "gradlew"))) ||
    (await fileExists(path.join(process.cwd(), "gradlew.bat")));
  logger.bullet("Gradle wrapper", tick(hasWrapper));

  logger.plain("");
  if (!env.sdkRoot)
    logger.warn(
      "Android SDK was not detected. Set ANDROID_SDK_ROOT or ANDROID_HOME."
    );
  if (!env.java.ok)
    logger.warn(
      "Java was not detected. JDK 17 remains the safest baseline for modern Android builds."
    );
  if (!env.gradle.ok)
    logger.warn(
      "Global Gradle was not detected. A project-local wrapper is still enough."
    );
  if (!hasWrapper)
    logger.warn("Gradle wrapper was not found in the current directory.");

  return env;
}
