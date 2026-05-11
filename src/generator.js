import path from "node:path";
import fs from "node:fs/promises";
import process from "node:process";

import { DEFAULTS, SUPPORTED_TEMPLATES } from "./constants.js";
import { loadProjectConfig } from "./config.js";
import { getTemplate, BUILTIN_TEMPLATES } from "./templates.js";
import { generateIcons } from "./icons.js";
import { logger } from "./logger.js";
import {
  applyTemplate,
  fileExists,
  hasHttpUrl,
  normalizeBoolean,
  parseList,
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

function mergeStrings(...values) {
  return uniq(values.flatMap((value) => parseList(value)));
}

function smartPermissions({ templateName, url, permissions }) {
  const list = parsePermissions(permissions);

  if (templateName === "webview" || templateName === "pwa" || ["react", "vue", "angular", "preact"].includes(templateName)) {
    list.push("android.permission.INTERNET");
  }

  if ((templateName === "webview" || templateName === "pwa") && hasHttpUrl(url)) {
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

function mergeConfigDefaults(configDefaults = {}, cliOptions = {}) {
  const defaults = configDefaults || {};

  const signingConfig = defaults.signing && typeof defaults.signing === "object"
    ? defaults.signing
    : {};

  return {
    name: pickFirstDefined(cliOptions.name, defaults.name, DEFAULTS.appName) || DEFAULTS.appName,
    package: pickFirstDefined(cliOptions.package, defaults.package, defaults.packageName, DEFAULTS.packageName) || DEFAULTS.packageName,
    template: normalizeTemplateName(pickFirstDefined(cliOptions.template, defaults.template, DEFAULTS.template) || DEFAULTS.template),
    minSdk: Number(pickFirstDefined(cliOptions.minSdk, defaults.minSdk, DEFAULTS.minSdk)),
    targetSdk: Number(pickFirstDefined(cliOptions.targetSdk, defaults.targetSdk, DEFAULTS.targetSdk)),
    compileSdk: Number(pickFirstDefined(cliOptions.compileSdk, defaults.compileSdk, DEFAULTS.compileSdk)),
    url: pickFirstDefined(cliOptions.url, defaults.url, DEFAULTS.webUrl) || DEFAULTS.webUrl,
    permissions: mergeStrings(defaults.permissions, cliOptions.permissions).join(","),
    icon: pickFirstDefined(cliOptions.icon, defaults.icon, "") || "",
    signing: {
      signingEnabled: normalizeBoolean(
        pickFirstDefined(cliOptions.signing, defaults.signing, signingConfig.enabled, signingConfig.signingEnabled),
        false
      ),
      keystore: pickFirstDefined(cliOptions.keystore, defaults.keystore, signingConfig.keystore, DEFAULTS.keystoreFile) || DEFAULTS.keystoreFile,
      keyAlias: pickFirstDefined(cliOptions.keyAlias, defaults.keyAlias, signingConfig.keyAlias, DEFAULTS.keystoreAlias) || DEFAULTS.keystoreAlias,
      storePassword: pickFirstDefined(cliOptions.storePassword, defaults.storePassword, signingConfig.storePassword, DEFAULTS.keystoreStorePassword) || DEFAULTS.keystoreStorePassword,
      keyPassword: pickFirstDefined(cliOptions.keyPassword, defaults.keyPassword, signingConfig.keyPassword, DEFAULTS.keystoreKeyPassword) || DEFAULTS.keystoreKeyPassword
    }
  };
}

function resolveTemplateRegistry(pluginTemplates = {}, configTemplates = {}) {
  return { ...BUILTIN_TEMPLATES, ...configTemplates, ...pluginTemplates };
}

async function getResolvedTemplate(templateName, registry = {}) {
  const template = getTemplate(templateName, registry);
  return template ? { template, registry } : { template: null, registry };
}

export async function generateProject(cliOptions = {}) {
  const projectConfig = await loadProjectConfig(process.cwd());
  const pluginBundle = await loadPlugins(process.cwd());
  const configDefaults = projectConfig.defaults || {};
  const opts = mergeConfigDefaults(configDefaults, cliOptions);
  const registry = resolveTemplateRegistry(pluginBundle.templates, projectConfig.templates);

  let projectName = String(opts.name).trim();
  let packageName = String(opts.package).trim();
  let templateName = normalizeTemplateName(opts.template);

  if (!projectName && !cliOptions.noPrompt) projectName = await promptText("Please enter the project name.", String(configDefaults.name || DEFAULTS.appName));
  if (!packageName && !cliOptions.noPrompt) packageName = await promptText("Please enter the Android package name.", String(configDefaults.package || configDefaults.packageName || DEFAULTS.packageName));
  if (!templateName && !cliOptions.noPrompt) templateName = await promptText("Please enter the template name.", String(configDefaults.template || DEFAULTS.template));

  if (!projectName) throw new Error("Project name is required.");
  if (!packageName) throw new Error("Package name is required.");
  if (!templateName) templateName = DEFAULTS.template;

  const { template } = await getResolvedTemplate(templateName, registry);
  if (!template) {
    const supported = [...SUPPORTED_TEMPLATES, ...Object.keys(registry || {})].sort().join(", ");
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
    plugins: pluginBundle.plugins,
    config: projectConfig,
    registry
  };

  await runHooks(pluginBundle.hooks.beforeGenerate, context);

  logger.title("JAPKGEN New");
  logger.info(`Project: ${projectName}`);
  logger.info(`Template: ${templateName}`);
  logger.info(`Folder: ${projectDir}`);
  if (projectConfig.path) {
    logger.note(`Config file: ${path.basename(projectConfig.path)}`);
  }

  await runHooks(pluginBundle.hooks.beforeWrite, context);
  await writeTemplateProject(projectDir, template, vars);
  await runHooks(pluginBundle.hooks.afterWrite, context);

  const manifestPath = path.join(projectDir, "app", "src", "main", "AndroidManifest.xml");
  let manifest = await fs.readFile(manifestPath, "utf8");
  manifest = manifest.replace("__PERMISSIONS__", permissionsXml ? `${permissionsXml}\n` : "");
  await fs.writeFile(manifestPath, manifest, "utf8");

  const buildGradlePath = path.join(projectDir, "build.gradle");
  let buildGradle = await fs.readFile(buildGradlePath, "utf8");
  buildGradle = applyTemplate(buildGradle, vars);
  await fs.writeFile(buildGradlePath, buildGradle, "utf8");

  const settingsPath = path.join(projectDir, "settings.gradle");
  let settings = await fs.readFile(settingsPath, "utf8");
  settings = settings.replace("__APP_NAME__", projectName.replace(/'/g, "\\'"));
  await fs.writeFile(settingsPath, settings, "utf8");

  const importantFiles = [
    "app/build.gradle",
    "app/src/main/res/values/strings.xml",
    "README.md",
    `app/src/main/java/${vars.PACKAGE_PATH}/MainActivity.java`,
    `app/src/main/java/${vars.PACKAGE_PATH}/MainActivity.kt`,
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

  await generateIcons({ projectDir, appName: projectName, iconPath: opts.icon || "" });

  if (opts.signing?.signingEnabled) {
    await writeSigningFiles(projectDir, opts.signing);
  }

  await runHooks(pluginBundle.hooks.afterGenerate, context);

  logger.success("Project generated successfully.");
  logger.note("Next steps: open the project folder and run `japkgen serve` or `japkgen build`.");
  return { projectDir, templateName, packageName, projectName };
}
