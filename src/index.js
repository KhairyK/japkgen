#!/usr/bin/env node
import process from "node:process";
import path from "node:path";
import prompts from "prompts";
import pc from "picocolors";

import { DEFAULTS, SUPPORTED_TEMPLATES } from "./constants.js";
import { loadProjectConfig } from "./config.js";
import { logger } from "./logger.js";
import { generateProject } from "./generator.js";
import { buildProject } from "./build.js";
import { runDoctor } from "./doctor.js";
import { serveProject } from "./serve.js";
import { createKeystore, sanitizeAlias } from "./signing.js";
import { runProjectTests } from "./test.js";
import { analyzeApk } from "./analyze.js";
import { runDependencyManager } from "./dependency-manager.js";
import { normalizeBoolean } from "./utils.js";

const VERSION = "2.2.0";
const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const YEAR = new Date().getFullYear();

const TEMPLATES = [...SUPPORTED_TEMPLATES];
const TEMPLATE_GROUPS = [
  {
    title: 'Web APK',
    value: 'web',
    templates: ['webview', 'pwa', 'bedbox'],
  },
  {
    title: 'Frontend frameworks',
    value: 'frontend',
    templates: ['react', 'solidjs', 'vue', 'angular', 'preact'],
  },
  {
    title: 'Android utilities',
    value: 'utility',
    templates: ['toybox', 'nextbox'],
  },
  {
    title: 'Android UI starters',
    value: 'ui',
    templates: ['native', 'compose', 'kotlin'],
  },
  {
    title: 'Native and game starters',
    value: 'native',
    templates: ['c', 'cpp', 'cmake', 'make', 'game-java', 'game-cpp'],
  },
  {
    title: 'Cross-platform mobile',
    value: 'cross',
    templates: ['react-native', 'flutter'],
  },
];

let clackPromptsModule = null;
async function loadCliPrompts() {
  if (clackPromptsModule !== null) return clackPromptsModule;
  try {
    clackPromptsModule = await import('@clack/prompts');
  } catch {
    clackPromptsModule = null;
  }
  return clackPromptsModule;
}

/**
 * Usages a value.
 */
function usage() {
  console.log(`
${pc.bold(pc.cyan("JAPK Generator"))} ${pc.green(VERSION)}

${pc.bold(pc.yellow("Usage:"))}
  ${pc.cyan("japkgen")} ${pc.green("new")} [options]
  ${pc.cyan("japkgen")} ${pc.green("build")} [projectDir] [options]
  ${pc.cyan("japkgen")} ${pc.green("doctor")}
  ${pc.cyan("japkgen")} ${pc.green("serve")} [projectDir] [options]
  ${pc.cyan("japkgen")} ${pc.green("keystore")} create [options]
  ${pc.cyan("japkgen")} ${pc.green("test")} [projectDir]
  ${pc.cyan("japkgen")} ${pc.green("analyze")} <file.apk>
  ${pc.cyan("japkgen")} ${pc.green("deps")} [list|add|remove] [projectDir]

${pc.bold(pc.yellow("Commands:"))}
  ${pc.green("new")}         ${pc.dim("Generate a new Android project")}
  ${pc.green("build")}       ${pc.dim("Build an Android project")}
  ${pc.green("doctor")}      ${pc.dim("Check environment readiness")}
  ${pc.green("serve")}       ${pc.dim("Start a static preview server")}
  ${pc.green("keystore")}    ${pc.dim("Create a release keystore")}
  ${pc.green("test")}        ${pc.dim("Validate generated project structure")}
  ${pc.green("analyze")}     ${pc.dim("Inspect APK contents")}
  ${pc.green("deps")}        ${pc.dim("Manage app/build.gradle dependencies")}

${pc.bold(pc.yellow("Templates:"))}
  ${TEMPLATES.map(/**
   * Functions a value.
   * @param {*} t
   * @returns {*}
   */
  t => pc.magenta(t)).join("\n  ")}

${pc.bold(pc.yellow("Config file:"))}
  ${pc.dim(
    "The CLI reads japkgen.config.json, japkgen.config.mjs, or japkgen.config.js from the current directory."
  )}

${pc.bold(pc.yellow("Notes:"))}
  ${pc.dim("If required values are omitted, the CLI will ask you interactively.")}

${pc.bold(pc.yellow("Options:"))}
  ${pc.cyan("--name")} <name>
  ${pc.cyan("--package")} <package>
  ${pc.cyan("--template")} <template>
  ${pc.cyan("--min-sdk")} <number>
  ${pc.cyan("--target-sdk")} <number>
  ${pc.cyan("--compile-sdk")} <number>
  ${pc.cyan("--url")} <url>
  ${pc.cyan("--permissions")} <list>
  ${pc.cyan("--icon")} <path>
  ${pc.cyan("--react-plugins")} <list>
  ${pc.cyan("--signing")}
  ${pc.cyan("--keystore")} <path>
  ${pc.cyan("--key-alias")} <alias>
  ${pc.cyan("--store-password")} <password>
  ${pc.cyan("--key-password")} <password>
`);
  console.warn(
    pc.yellow(
      `Warning: JAPK Generator ${VERSION} is in early beta. Please review the generated code and provide feedback.\n${YEAR} (C) OpenDN Foundation.`
    )
  );
  process.exit(0);
}

/**
 * Parses Flags.
 * @param {*} argv
 * @returns {Object}
 */
function parseFlags(argv) {
  const options = {};
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg.startsWith("-")) {
      rest.push(arg);
      continue;
    }

    const [key, inlineValue] = arg.startsWith("--")
      ? arg.slice(2).split("=")
      : [arg.slice(1), null];

    const name = key.replace(/-([a-z])/g, /**
     * Functions a value.
     * @param {*} _
     * @param {*} c
     * @returns {*}
     */
    (_, c) => c.toUpperCase());
    const value =
      inlineValue ??
      (i + 1 < argv.length && !argv[i + 1].startsWith("-") ? argv[++i] : true);

    options[name] = value;
  }

  return { options, rest };
}

/**
 * Tos String Value.
 * @param {*} value
 * @param {*} fallback
 * @returns {*}
 */
function toStringValue(value, fallback = "") {
  if (value === undefined || value === null) return String(fallback ?? "");
  return String(value);
}

/**
 * Asks a value.
 * @param {*} question
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
async function ask(question, defaultValue = "") {
  if (!interactive) {
    return toStringValue(defaultValue);
  }

  const clack = await loadCliPrompts();
  const hasDefault =
    defaultValue !== undefined &&
    defaultValue !== null &&
    String(defaultValue).length > 0;

  if (clack?.text) {
    const value = await clack.text({
      message: question,
      placeholder: hasDefault ? String(defaultValue) : undefined,
      defaultValue: hasDefault ? String(defaultValue) : undefined,
    });
    if (clack.isCancel?.(value)) {
      throw new Error("Prompt cancelled by user.");
    }
    const textValue = toStringValue(value, defaultValue).trim();
    return textValue.length > 0 ? textValue : toStringValue(defaultValue);
  }

  const response = await prompts(
    {
      type: "text",
      name: "value",
      message: question,
      initial: hasDefault ? String(defaultValue) : undefined,
    },
    {
      onCancel: () => {
        throw new Error("Prompt cancelled by user.");
      },
    }
  );

  const value = toStringValue(response.value, defaultValue).trim();
  return value.length > 0 ? value : toStringValue(defaultValue);
}

/**
 * Asks Required.
 * @param {*} question
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
async function askRequired(question, defaultValue = "") {
  if (!interactive) {
    const fallback = toStringValue(defaultValue).trim();
    if (fallback.length > 0) return fallback;
    throw new Error(`${question} This value is required.`);
  }

  const clack = await loadCliPrompts();
  if (clack?.text) {
    while (true) {
      const value = await clack.text({
        message: question,
        placeholder:
          defaultValue !== undefined &&
          defaultValue !== null &&
          String(defaultValue).length > 0
            ? String(defaultValue)
            : undefined,
        defaultValue:
          defaultValue !== undefined &&
          defaultValue !== null &&
          String(defaultValue).length > 0
            ? String(defaultValue)
            : undefined,
      });
      if (clack.isCancel?.(value)) {
        throw new Error("Prompt cancelled by user.");
      }
      const textValue = String(value ?? "").trim();
      if (textValue.length > 0) return textValue;
    }
  }

  while (true) {
    const response = await prompts(
      {
        type: "text",
        name: "value",
        message: question,
        initial:
          defaultValue !== undefined &&
          defaultValue !== null &&
          String(defaultValue).length > 0
            ? String(defaultValue)
            : undefined,
        validate: (value) => {
          const text = String(value ?? "").trim();
          return text.length > 0 ? true : "A value is required.";
        },
      },
      {
        onCancel: () => {
          throw new Error("Prompt cancelled by user.");
        },
      }
    );

    const value = String(response.value ?? "").trim();
    if (value.length > 0) return value;
  }
}

/**
 * Asks Yes No.
 * @param {*} question
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
async function askYesNo(question, defaultValue = false) {
  if (!interactive) {
    return Boolean(defaultValue);
  }

  const clack = await loadCliPrompts();
  if (clack?.confirm) {
    const value = await clack.confirm({
      message: question,
      initialValue: Boolean(defaultValue),
    });
    if (clack.isCancel?.(value)) {
      throw new Error("Prompt cancelled by user.");
    }
    return Boolean(value);
  }

  const response = await prompts(
    {
      type: "confirm",
      name: "value",
      message: question,
      initial: Boolean(defaultValue),
    },
    {
      onCancel: () => {
        throw new Error("Prompt cancelled by user.");
      },
    }
  );

  return Boolean(response.value);
}

/**
 * Asks Choice.
 * @param {*} question
 * @param {*} choices
 * @param {*} defaultValue
 * @returns {Promise<*>}
 */
async function askChoice(question, choices, defaultValue) {
  if (!interactive) {
    if (
      defaultValue === undefined ||
      defaultValue === null ||
      String(defaultValue).length === 0
    ) {
      throw new Error(`${question} This value is required.`);
    }
    return defaultValue;
  }

  const normalizedChoices = choices.map((choice) => ({
    title: choice,
    value: choice,
  }));

  const defaultIndex = Math.max(
    0,
    normalizedChoices.findIndex(
      (choice) =>
        choice.value.toLowerCase() === String(defaultValue ?? "").toLowerCase()
    )
  );

  const clack = await loadCliPrompts();
  if (clack?.select) {
    const value = await clack.select({
      message: question,
      options: normalizedChoices.map((choice) => ({
        label: choice.title,
        value: choice.value,
      })),
      initialValue: normalizedChoices[defaultIndex]?.value || normalizedChoices[0]?.value,
    });
    if (clack.isCancel?.(value)) {
      throw new Error("Prompt cancelled by user.");
    }
    return value ?? defaultValue;
  }

  const response = await prompts(
    {
      type: "select",
      name: "value",
      message: question,
      choices: normalizedChoices,
      initial: defaultIndex >= 0 ? defaultIndex : 0,
    },
    {
      onCancel: () => {
        throw new Error("Prompt cancelled by user.");
      },
    }
  );

  return response.value ?? defaultValue;
}

/**
 * Picks a template from grouped categories.
 * @param {string} defaultTemplate
 * @returns {Promise<string>}
 */
async function askTemplateChoice(defaultTemplate) {
  const normalizedDefault = String(defaultTemplate || DEFAULTS.template).toLowerCase();
  const defaultGroup = TEMPLATE_GROUPS.find(group => group.templates.includes(normalizedDefault)) || TEMPLATE_GROUPS[0];
  const group = await askChoice(
    'Please select a template family.',
    TEMPLATE_GROUPS.map(group => group.title),
    defaultGroup.title
  );
  const selectedGroup = TEMPLATE_GROUPS.find(item => item.title === group) || defaultGroup;
  return askChoice(
    'Please select a project template.',
    selectedGroup.templates,
    normalizedDefault
  );
}

/**
 * Determines whether the selected template belongs to the web stack.
 * @param {string} template
 * @returns {boolean}
 */
function isWebTemplate(template) {
  return ['webview', 'pwa', 'bedbox', 'react', 'solidjs', 'vue', 'angular', 'preact'].includes(String(template).toLowerCase());
}

/**
 * Prompts New Options.
 * @param {*} options
 * @param {*} configDefaults
 * @returns {Promise<Object>}
 */
async function promptNewOptions(options, configDefaults = {}) {
  const defaultName = configDefaults.name || DEFAULTS.appName;
  const defaultPackage =
    configDefaults.package ||
    configDefaults.packageName ||
    DEFAULTS.packageName;
  const defaultTemplate = configDefaults.template || DEFAULTS.template;
  const defaultMinSdk = configDefaults.minSdk ?? DEFAULTS.minSdk;
  const defaultTargetSdk = configDefaults.targetSdk ?? DEFAULTS.targetSdk;
  const defaultCompileSdk = configDefaults.compileSdk ?? DEFAULTS.compileSdk;
  const defaultUrl = configDefaults.url || DEFAULTS.webUrl;
  const defaultPermissions = Array.isArray(configDefaults.permissions)
    ? configDefaults.permissions.join(',')
    : String(configDefaults.permissions || '');
  const defaultIcon = configDefaults.icon || '';
  const defaultSigning =
    typeof configDefaults.signing === 'boolean'
      ? configDefaults.signing
      : normalizeBoolean(
          configDefaults.signing?.enabled ?? configDefaults.signing?.signingEnabled,
          false
        );

  const name = String(
    options.name ??
      (await askRequired('Please enter the project name.', defaultName))
  ).trim();

  const packageName = String(
    options.package ??
      (await askRequired(
        'Please enter the Android package name.',
        defaultPackage
      ))
  ).trim();

  let template = String(options.template ?? '').trim().toLowerCase();
  if (!template) {
    template = await askTemplateChoice(defaultTemplate);
  }

  const minSdk = Number(
    options.minSdk ??
      (await ask('Please enter the minimum SDK level.', String(defaultMinSdk)))
  );
  const targetSdk = Number(
    options.targetSdk ??
      (await ask('Please enter the target SDK level.', String(defaultTargetSdk)))
  );
  const compileSdk = Number(
    options.compileSdk ??
      (await ask('Please enter the compile SDK level.', String(defaultCompileSdk)))
  );

  const url = String(options.url ?? '').trim();
  const finalUrl =
    url ||
    (isWebTemplate(template)
      ? String(
          await askRequired('Please enter the application URL.', defaultUrl)
        ).trim()
      : '');

  const permissionsInput = String(
    options.permissions ?? defaultPermissions
  ).trim();
  const icon = String(
    options.icon ?? (await ask('Please enter the icon path.', defaultIcon))
  ).trim();

  const reactPlugins =
    template === 'react'
      ? String(
          options.reactPlugins ??
            (await ask(
              'Please enter React plugin packages (comma-separated).',
              String(configDefaults.reactPlugins || '')
            ))
        ).trim()
      : '';

  const signing =
    options.signing !== undefined
      ? normalizeBoolean(options.signing)
      : await askYesNo(
          'Would you like to enable signing scaffolding?',
          defaultSigning
        );

  return {
    name,
    package: packageName,
    template,
    minSdk,
    targetSdk,
    compileSdk,
    url: finalUrl,
    permissions: permissionsInput,
    icon,
    reactPlugins,
    signing,
  };
}

/**
 * Prompts Build Options.

 * @param {*} projectDirArg
 * @param {*} options
 * @param {*} configDefaults
 * @returns {Promise<Object>}
 */
async function promptBuildOptions(projectDirArg, options, configDefaults = {}) {
  const projectDir = path.resolve(
    projectDirArg ??
      options.projectDir ??
      configDefaults.projectDir ??
      (await ask("Please enter the project directory.", process.cwd()))
  );

  const variant =
    options.variant ??
    configDefaults.variant ??
    (await askChoice(
      "Please select a build variant.",
      ["debug", "release"],
      DEFAULTS.variant
    ));

  const gradleVersion = String(
    options.gradleVersion ??
      configDefaults.gradleVersion ??
      (await ask(
        "Please enter the Gradle version.",
        String(DEFAULTS.gradleVersion)
      ))
  ).trim();

  return { projectDir, variant, gradleVersion };
}

/**
 * Prompts Serve Options.
 * @param {*} projectDirArg
 * @param {*} options
 * @param {*} configDefaults
 * @returns {Promise<Object>}
 */
async function promptServeOptions(projectDirArg, options, configDefaults = {}) {
  const projectDir = path.resolve(
    projectDirArg ??
      options.projectDir ??
      configDefaults.projectDir ??
      (await ask("Please enter the project directory.", process.cwd()))
  );

  const port = Number(
    options.port ??
      configDefaults.port ??
      (await ask("Please enter the server port.", String(DEFAULTS.servePort)))
  );
  const watch =
    options.watch !== undefined
      ? normalizeBoolean(options.watch, true)
      : await askYesNo(
          "Would you like to enable file watching?",
          configDefaults.watch ?? true
        );

  return { projectDir, port, watch };
}

/**
 * Prompts Keystore Options.
 * @param {*} options
 * @param {*} configDefaults
 * @returns {Promise<Object>}
 */
async function promptKeystoreOptions(options, configDefaults = {}) {
  const keystorePath = path.resolve(
    options.path ??
      options.keystore ??
      configDefaults.keystore ??
      (await ask("Please enter the keystore file path.", DEFAULTS.keystoreFile))
  );

  const alias = sanitizeAlias(
    String(
      options.alias ??
        configDefaults.keyAlias ??
        (await ask("Please enter the key alias.", DEFAULTS.keystoreAlias))
    ).trim()
  );

  const storePassword = String(
    options.storePassword ??
      configDefaults.storePassword ??
      (await ask(
        "Please enter the keystore password.",
        DEFAULTS.keystoreStorePassword
      ))
  ).trim();

  const keyPassword = String(
    options.keyPassword ??
      configDefaults.keyPassword ??
      (await ask(
        "Please enter the key password.",
        DEFAULTS.keystoreKeyPassword
      ))
  ).trim();

  const dname = String(
    options.dname ??
      (await ask(
        "Please enter the distinguished name (DN).",
        "CN=Android Dev, OU=JAPKGEN, O=OpenDN, L=Indonesia, S=Indonesia, C=ID"
      ))
  ).trim();

  const validityDays = Number(
    options.validity ??
      (await ask(
        "Please enter the certificate validity period in days.",
        "10000"
      ))
  );

  return {
    keystorePath,
    alias,
    storePassword,
    keyPassword,
    dname,
    validityDays,
  };
}

/**
 * Prompts Test Options.
 * @param {*} projectDirArg
 * @param {*} configDefaults
 * @returns {Promise<Object>}
 */
async function promptTestOptions(projectDirArg, configDefaults = {}) {
  return {
    projectDir: path.resolve(
      projectDirArg ??
        configDefaults.projectDir ??
        (await ask("Please enter the project directory.", process.cwd()))
    ),
  };
}

/**
 * Prompts Analyze Options.
 * @param {*} targetArg
 * @returns {Promise<Object>}
 */
async function promptAnalyzeOptions(targetArg) {
  const target = path.resolve(
    targetArg ?? (await askRequired("Please enter the APK file path."))
  );
  return { target };
}

/**
 * Mains a value.
 * @returns {Promise<void>}
 */
async function main() {
  const projectConfig = await loadProjectConfig(process.cwd());
  const configDefaults = projectConfig.defaults || {};
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    usage();
  }

  if (cmd === "--version" || cmd === "-v" || cmd === "version") {
    console.log(VERSION);
    process.exit(0);
  }

  if (cmd === "new" || cmd === "init") {
    const { options } = parseFlags(argv.slice(1));
    const promptOptions = await promptNewOptions(options, configDefaults);

    await generateProject({
      ...promptOptions,
      signing: normalizeBoolean(promptOptions.signing),
    });
    process.exit(0);
  }

  if (cmd === "build") {
    const maybeDir = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { options } = parseFlags(argv.slice(maybeDir ? 2 : 1));
    const { projectDir, variant, gradleVersion } = await promptBuildOptions(
      maybeDir,
      options,
      configDefaults
    );

    await buildProject(projectDir, {
      variant,
      gradleVersion,
    });
    process.exit(0);
  }

  if (cmd === "doctor") {
    await runDoctor();
    process.exit(0);
  }

  if (cmd === "serve") {
    const maybeDir = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { options } = parseFlags(argv.slice(maybeDir ? 2 : 1));
    const { projectDir, port, watch } = await promptServeOptions(
      maybeDir,
      options,
      configDefaults
    );

    await serveProject(projectDir, { port, watch });
    return;
  }

  if (cmd === "keystore" && argv[1] === "create") {
    const { options } = parseFlags(argv.slice(2));
    const {
      keystorePath,
      alias,
      storePassword,
      keyPassword,
      dname,
      validityDays,
    } = await promptKeystoreOptions(options, configDefaults);

    const result = await createKeystore({
      keystorePath,
      alias,
      storePassword,
      keyPassword,
      dname,
      validityDays,
    });

    logger.success(`Keystore created: ${result.keystorePath}`);
    process.exit(0);
  }

  if (cmd === "test") {
    const maybeDir = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { projectDir } = await promptTestOptions(maybeDir, configDefaults);

    await runProjectTests(projectDir);
    process.exit(0);
  }

  if (cmd === "deps") {
    const action = String(argv[1] && !argv[1].startsWith("-") ? argv[1] : "list").toLowerCase();
    const projectDirArg =
      argv[2] && !argv[2].startsWith("-") ? argv[2] : undefined;
    const flagsStart = projectDirArg ? 3 : action === "list" ? 2 : 2;
    const { options } = parseFlags(argv.slice(flagsStart));

    await runDependencyManager(projectDirArg, { action, ...options });
    process.exit(0);
  }

  if (cmd === "analyze") {
    const targetArg = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { target } = await promptAnalyzeOptions(targetArg);

    await analyzeApk(target);
    process.exit(0);
  }

  throw new Error(`JAPK Generator ${VERSION} | Unknown command: ${cmd}.
See 'japkgen --help' for usage information.`);
}

main().catch(/**
 * Functions a value.
 * @param {*} error
 */
error => {
  logger.error(error?.message || String(error));
  process.exit(1);
});
