import path from "node:path";
import fs from "node:fs/promises";
import process from "node:process";

import { DEFAULTS, SUPPORTED_TEMPLATES } from "./constants.js";
import { getTemplate, BUILTIN_TEMPLATES } from "./templates.js";
import { generateIcons } from "./icons.js";
import { logger } from "./logger.js";
import {
  applyTemplate,
  fileExists,
  hasHttpUrl,
  normalizeBoolean,
  parsePermissions,
  pickFirstDefined,
  templateExists,
  toJniPackage,
  toPackagePath,
  uniq,
  writeFileEnsured
} from "./utils.js";
import { writeSigningFiles } from "./signing.js";
import { loadPlugins, runHooks } from "./plugins.js";

async function promptText(message, initial = "") {
  const { createInterface } = await import("node:readline/promises");
  const r = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await r.question(`${message}${initial ? ` (${initial})` : ""}: `);
    return String(ans).trim() || initial;
  } finally {
    r.close();
  }
}

async function promptYesNo(message, initial = false) {
  const { createInterface } = await import("node:readline/promises");
  const r = createInterface({ input: process.stdin, output: process.stdout });
  const suffix = initial ? " [Y/n]" : " [y/N]";
  try {
    while (true) {
      const ans = String(await r.question(`${message}${suffix}: `)).trim().toLowerCase();
      if (!ans) return initial;
      if (["y", "yes", "true", "1"].includes(ans)) return true;
      if (["n", "no", "false", "0"].includes(ans)) return false;
      console.log("Please answer with yes or no.");
    }
  } finally {
    r.close();
  }
}

function normalizeTemplateName(name) {
  return String(name || "").trim().toLowerCase();
}

function smartPermissions({ templateName, url, permissions }) {
  const list = parsePermissions(permissions);

  if (templateName === "webview" || templateName === "pwa") {
    list.push("android.permission.INTERNET");
  }

  if (templateName === "webview" && hasHttpUrl(url)) {
    list.push("android.permission.ACCESS_NETWORK_STATE");
  }

  return uniq(list);
}

async function writeTemplateProject(projectDir, template, vars) {
  for (const [rawRelativePath, rawContent] of Object.entries(template.files || {})) {
    const relativePath = applyTemplate(rawRelativePath, vars);
    const outputPath = path.join(projectDir, relativePath);
    const outputContent = applyTemplate(rawContent, vars);
    await writeFileEnsured(outputPath, outputContent);
  }
}

async function resolveProjectDir(name) {
  const safeName = String(name).trim() || DEFAULTS.appName;
  return path.resolve(process.cwd(), safeName);
}

async function getResolvedTemplate(templateName, pluginTemplates = {}) {
  const mergedRegistry = { ...BUILTIN_TEMPLATES, ...pluginTemplates };
  const template = getTemplate(templateName, mergedRegistry);
  return template ? { template, registry: mergedRegistry } : { template: null, registry: mergedRegistry };
}

export async function generateProject(cliOptions = {}) {
  const pluginBundle = await loadPlugins(process.cwd());
  const opts = {
    name: pickFirstDefined(cliOptions.name, DEFAULTS.appName) || DEFAULTS.appName,
    package: pickFirstDefined(cliOptions.package, DEFAULTS.packageName) || DEFAULTS.packageName,
    template: pickFirstDefined(cliOptions.template, DEFAULTS.template) || DEFAULTS.template,
    minSdk: Number(pickFirstDefined(cliOptions.minSdk, DEFAULTS.minSdk)),
    targetSdk: Number(pickFirstDefined(cliOptions.targetSdk, DEFAULTS.targetSdk)),
    compileSdk: Number(pickFirstDefined(cliOptions.compileSdk, DEFAULTS.compileSdk)),
    url: pickFirstDefined(cliOptions.url, DEFAULTS.webUrl) || DEFAULTS.webUrl,
    permissions: pickFirstDefined(cliOptions.permissions, "") || "",
    icon: pickFirstDefined(cliOptions.icon, "") || "",
    signing: {
      signingEnabled: normalizeBoolean(cliOptions.signing),
      keystore: pickFirstDefined(cliOptions.keystore, DEFAULTS.keystoreFile) || DEFAULTS.keystoreFile,
      keyAlias: pickFirstDefined(cliOptions.keyAlias, DEFAULTS.keystoreAlias) || DEFAULTS.keystoreAlias,
      storePassword: pickFirstDefined(cliOptions.storePassword, DEFAULTS.keystoreStorePassword) || DEFAULTS.keystoreStorePassword,
      keyPassword: pickFirstDefined(cliOptions.keyPassword, DEFAULTS.keystoreKeyPassword) || DEFAULTS.keystoreKeyPassword
    }
  };

  let projectName = String(opts.name).trim();
  let packageName = String(opts.package).trim();
  let templateName = normalizeTemplateName(opts.template);

  if (!projectName && !cliOptions.noPrompt) projectName = await promptText("Please enter the project name.", DEFAULTS.appName);
  if (!packageName && !cliOptions.noPrompt) packageName = await promptText("Please enter the Android package name.", DEFAULTS.packageName);
  if (!templateName && !cliOptions.noPrompt) templateName = await promptText("Please enter the template name.", DEFAULTS.template);

  if (!projectName) throw new Error("Project name is required.");
  if (!packageName) throw new Error("Package name is required.");
  if (!templateName) templateName = DEFAULTS.template;

  const { template } = await getResolvedTemplate(templateName, pluginBundle.templates);
  if (!template) {
    const supported = [...SUPPORTED_TEMPLATES, ...Object.keys(pluginBundle.templates || {})].join(", ");
    throw new Error(`Unknown template: ${templateName}. Supported templates: ${supported}`);
  }

  const projectDir = await resolveProjectDir(projectName);
  if (await templateExists(projectDir)) {
    throw new Error(`Project already appears to exist: ${projectDir}`);
  }

  await fs.mkdir(projectDir, { recursive: true });

  const vars = {
    APP_NAME: projectName,
    PACKAGE: packageName,
    PACKAGE_PATH: toPackagePath(packageName),
    PACKAGE_JNI: toJniPackage(packageName),
    MIN_SDK: opts.minSdk,
    TARGET_SDK: opts.targetSdk,
    COMPILE_SDK: opts.compileSdk,
    AGP_VERSION: DEFAULTS.agpVersion,
    KOTLIN_VERSION: DEFAULTS.kotlinVersion,
    CMAKE_VERSION: DEFAULTS.cmakeVersion,
    WEB_URL: opts.url || DEFAULTS.webUrl
  };

  const permissions = smartPermissions({
    templateName,
    url: opts.url,
    permissions: opts.permissions
  });

  const permissionsXml = permissions.length
    ? permissions.map((p) => `    <uses-permission android:name="${p}" />`).join("\n")
    : "";

  const context = {
    projectDir,
    projectName,
    packageName,
    templateName,
    template,
    vars,
    options: opts,
    plugins: pluginBundle.plugins
  };

  await runHooks(pluginBundle.hooks.beforeGenerate, context);

  logger.title("JAPKGEN New");
  logger.info(`Project: ${projectName}`);
  logger.info(`Template: ${templateName}`);
  logger.info(`Folder: ${projectDir}`);

  await runHooks(pluginBundle.hooks.beforeWrite, context);
  await writeTemplateProject(projectDir, template, vars);
  await runHooks(pluginBundle.hooks.afterWrite, context);

  const manifestPath = path.join(projectDir, "app", "src", "main", "AndroidManifest.xml");
  let manifest = await fs.readFile(manifestPath, "utf8");
  manifest = manifest.replace("__PERMISSIONS__", permissionsXml ? `${permissionsXml}
` : "");
  await fs.writeFile(manifestPath, manifest, "utf8");

  const buildGradlePath = path.join(projectDir, "build.gradle");
  let buildGradle = await fs.readFile(buildGradlePath, "utf8");
  buildGradle = applyTemplate(buildGradle, vars);
  await fs.writeFile(buildGradlePath, buildGradle, "utf8");

  const settingsPath = path.join(projectDir, "settings.gradle");
  let settings = await fs.readFile(settingsPath, "utf8");
  settings = settings.replace("__APP_NAME__", projectName.replace(/'/g, "\'"));
  await fs.writeFile(settingsPath, settings, "utf8");

  const importantFiles = [
    "app/build.gradle",
    "app/src/main/res/values/strings.xml",
    "README.md",
    `app/src/main/java/${vars.PACKAGE_PATH}/MainActivity.java`,
    `app/src/main/kotlin/${vars.PACKAGE_PATH}/MainActivity.kt`,
    "app/src/main/res/layout/activity_main.xml"
  ];

  for (const rel of importantFiles) {
    const filePath = path.join(projectDir, rel);
    if (await fileExists(filePath)) {
      let content = await fs.readFile(filePath, "utf8");
      content = applyTemplate(content, vars);
      await fs.writeFile(filePath, content, "utf8");
    }
  }

  if (opts.icon) {
    await generateIcons({ projectDir, appName: projectName, iconPath: opts.icon });
  } else {
    await generateIcons({ projectDir, appName: projectName, iconPath: "" });
  }

  if (opts.signing?.signingEnabled) {
    await writeSigningFiles(projectDir, opts.signing);
  }

  await runHooks(pluginBundle.hooks.afterGenerate, context);

  logger.success("Project generated successfully.");
  logger.note("Next steps: open the project folder and run `japkgen serve` or `japkgen build`.");
  return { projectDir, templateName, packageName, projectName };
}
