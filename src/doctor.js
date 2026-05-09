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
  logger.bullet("Java", `${tick(env.java.ok)} ${env.java.ok ? "found" : "missing"}`);
  logger.bullet("Gradle", `${tick(env.gradle.ok)} ${env.gradle.ok ? "found" : "missing"}`);
  logger.bullet("ADB", `${tick(env.adb.ok)} ${env.adb.ok ? "found" : "missing"}`);
  logger.bullet("Android SDK", env.sdkRoot || "not found");
  logger.bullet("platform-tools", tick(Boolean(env.sdkPlatformTools)));
  logger.bullet("build-tools", tick(Boolean(env.sdkBuildTools)));

  const hasWrapper = await fileExists(path.join(process.cwd(), "gradlew")) || await fileExists(path.join(process.cwd(), "gradlew.bat"));
  logger.bullet("Gradle wrapper", tick(hasWrapper));

  logger.plain("");
  if (!env.sdkRoot) logger.warn("Android SDK belum ketemu. Set ANDROID_SDK_ROOT atau ANDROID_HOME.");
  if (!env.java.ok) logger.warn("Java belum ketemu. JDK 17 paling aman buat Android build modern.");
  if (!env.gradle.ok) logger.warn("Gradle global belum ketemu. Kalau project punya wrapper, itu tetap aman.");
  if (!hasWrapper) logger.warn("Gradle wrapper belum ada di folder ini.");

  return env;
}
