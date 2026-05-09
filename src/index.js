#!/usr/bin/env node
import process from "node:process";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { DEFAULTS, SUPPORTED_TEMPLATES } from "./constants.js";
import { logger } from "./logger.js";
import { generateProject } from "./generator.js";
import { buildProject } from "./build.js";
import { runDoctor } from "./doctor.js";
import { serveProject } from "./serve.js";
import { createKeystore, sanitizeAlias } from "./signing.js";
import { runProjectTests } from "./test.js";
import { analyzeApk } from "./analyze.js";
import { normalizeBoolean } from "./utils.js";

const VERSION = "1.2.0";
const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const rl = interactive ? readline.createInterface({ input, output }) : null;

const TEMPLATES = [...SUPPORTED_TEMPLATES];

function usage() {
  console.log(`
JAPK Generator ${VERSION}

Usage:
  japkgen new [options]
  japkgen build [projectDir] [options]
  japkgen doctor
  japkgen serve [projectDir] [options]
  japkgen keystore create [options]
  japkgen test [projectDir]
  japkgen analyze <file.apk>

Commands:
  new         Generate a new Android project
  build       Build an Android project
  doctor      Check environment readiness
  serve       Start a friendly static preview server
  keystore    Create a release keystore
  test        Validate generated project structure
  analyze     Inspect APK contents

Templates:
  ${TEMPLATES.join("\n  ")}

Notes:
  If required values are omitted, the CLI will ask you interactively.

Options:
  --name <name>
  --package <package>
  --template <template>
  --min-sdk <number>
  --target-sdk <number>
  --compile-sdk <number>
  --url <url>
  --permissions <list>
  --icon <path>
  --signing
  --keystore <path>
  --key-alias <alias>
  --store-password <password>
  --key-password <password>
`);
process.exit(0);
}

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

    const name = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value =
      inlineValue ?? (i + 1 < argv.length && !argv[i + 1].startsWith("-") ? argv[++i] : true);

    options[name] = value;
  }

  return { options, rest };
}

async function ask(question, defaultValue = "") {
  if (!interactive || !rl) {
    return defaultValue;
  }

  const suffix =
    defaultValue !== undefined && defaultValue !== null && String(defaultValue).length > 0
      ? ` [${defaultValue}]`
      : "";

  const answer = await rl.question(`${question}${suffix}: `);
  const trimmed = answer.trim();

  return trimmed.length > 0 ? trimmed : String(defaultValue ?? "");
}

async function askRequired(question, defaultValue = "") {
  while (true) {
    const answer = await ask(question, defaultValue);
    if (String(answer).trim().length > 0) return String(answer).trim();

    if (!interactive) {
      throw new Error(`${question} This value is required.`);
    }

    console.log("A value is required. Please try again.");
  }
}

async function askYesNo(question, defaultValue = false) {
  if (!interactive || !rl) {
    return defaultValue;
  }

  const suffix = defaultValue ? " [Y/n]" : " [y/N]";

  while (true) {
    const answer = await rl.question(`${question}${suffix}: `);
    const normalized = answer.trim().toLowerCase();

    if (!normalized) return defaultValue;
    if (["y", "yes", "true", "1"].includes(normalized)) return true;
    if (["n", "no", "false", "0"].includes(normalized)) return false;

    console.log("Please answer with yes or no.");
  }
}

async function askChoice(question, choices, defaultValue) {
  if (!interactive || !rl) {
    return defaultValue;
  }

  console.log(question);
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}) ${choice}`);
  });

  while (true) {
    const answer = await rl.question(`Please select an option [${defaultValue}]: `);
    const trimmed = answer.trim();

    if (!trimmed) return defaultValue;

    const asNumber = Number(trimmed);
    if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= choices.length) {
      return choices[asNumber - 1];
    }

    const matched = choices.find((choice) => choice.toLowerCase() === trimmed.toLowerCase());
    if (matched) return matched;

    console.log("Please enter a valid selection.");
  }
}

async function promptNewOptions(options) {
  const name = String(options.name ?? (await askRequired("Please enter the project name."))).trim();
  const packageName = String(
    options.package ?? (await askRequired("Please enter the Android package name.", DEFAULTS.packageName))
  ).trim();

  let template = String(options.template ?? "").trim().toLowerCase();
  if (!template) {
    template = String(
      await askChoice("Please select a project template.", TEMPLATES, DEFAULTS.template)
    ).trim().toLowerCase();
  }

  const minSdk = Number(
    options.minSdk ?? (await ask("Please enter the minimum SDK level.", String(DEFAULTS.minSdk)))
  );
  const targetSdk = Number(
    options.targetSdk ?? (await ask("Please enter the target SDK level.", String(DEFAULTS.targetSdk)))
  );
  const compileSdk = Number(
    options.compileSdk ?? (await ask("Please enter the compile SDK level.", String(DEFAULTS.compileSdk)))
  );

  const url = String(options.url ?? "").trim();
  const finalUrl = url || (template === "webview" || template === "pwa" ? String(await askRequired("Please enter the application URL.", DEFAULTS.webUrl)).trim() : "");

  const permissionsInput = String(options.permissions ?? "").trim();
  const icon = String(options.icon ?? (await ask("Please enter the icon path.", ""))).trim();

  const signing =
    options.signing !== undefined
      ? normalizeBoolean(options.signing)
      : await askYesNo("Would you like to enable signing scaffolding?", false);

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
    signing
  };
}

async function promptBuildOptions(projectDirArg, options) {
  const projectDir = path.resolve(
    projectDirArg ?? options.projectDir ?? (await ask("Please enter the project directory.", process.cwd()))
  );

  const variant =
    options.variant ??
    (await askChoice("Please select a build variant.", ["debug", "release"], DEFAULTS.variant));

  const gradleVersion = String(
    options.gradleVersion ??
      (await ask("Please enter the Gradle version.", String(DEFAULTS.gradleVersion)))
  ).trim();

  return { projectDir, variant, gradleVersion };
}

async function promptServeOptions(projectDirArg, options) {
  const projectDir = path.resolve(
    projectDirArg ?? options.projectDir ?? (await ask("Please enter the project directory.", process.cwd()))
  );

  const port = Number(options.port ?? (await ask("Please enter the server port.", String(DEFAULTS.servePort))));
  const watch =
    options.watch !== undefined
      ? normalizeBoolean(options.watch, true)
      : await askYesNo("Would you like to enable file watching?", true);

  return { projectDir, port, watch };
}

async function promptKeystoreOptions(options) {
  const keystorePath = path.resolve(
    options.path ?? options.keystore ?? (await ask("Please enter the keystore file path.", DEFAULTS.keystoreFile))
  );

  const alias = sanitizeAlias(
    String(options.alias ?? (await ask("Please enter the key alias.", DEFAULTS.keystoreAlias))).trim()
  );

  const storePassword = String(
    options.storePassword ?? (await ask("Please enter the keystore password.", DEFAULTS.keystoreStorePassword))
  ).trim();

  const keyPassword = String(
    options.keyPassword ?? (await ask("Please enter the key password.", DEFAULTS.keystoreKeyPassword))
  ).trim();

  const dname = String(
    options.dname ??
      (await ask(
        "Please enter the distinguished name (DN).",
        "CN=Android Dev, OU=JAPKGEN, O=OpenDN, L=Indonesia, S=Indonesia, C=ID"
      ))
  ).trim();

  const validityDays = Number(options.validity ?? (await ask("Please enter the certificate validity period in days.", "10000")));

  return {
    keystorePath,
    alias,
    storePassword,
    keyPassword,
    dname,
    validityDays
  };
}

async function promptTestOptions(projectDirArg) {
  return {
    projectDir: path.resolve(
      projectDirArg ?? (await ask("Please enter the project directory.", process.cwd()))
    )
  };
}

async function promptAnalyzeOptions(targetArg) {
  const target = path.resolve(targetArg ?? (await askRequired("Please enter the APK file path.")));
  return { target };
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    usage();
    return;
  }

  if (cmd === "--version" || cmd === "-v" || cmd === "version") {
    console.log(VERSION);
    return;
  }

  if (cmd === "new" || cmd === "init") {
    const { options } = parseFlags(argv.slice(1));
    const promptOptions = await promptNewOptions(options);

    await generateProject({
      ...promptOptions,
      signing: normalizeBoolean(promptOptions.signing)
    });
    return;
  }

  if (cmd === "build") {
    const maybeDir = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { options } = parseFlags(argv.slice(maybeDir ? 2 : 1));
    const { projectDir, variant, gradleVersion } = await promptBuildOptions(maybeDir, options);

    await buildProject(projectDir, {
      variant,
      gradleVersion
    });
    return;
  }

  if (cmd === "doctor") {
    await runDoctor();
    return;
  }

  if (cmd === "serve") {
    const maybeDir = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { options } = parseFlags(argv.slice(maybeDir ? 2 : 1));
    const { projectDir, port, watch } = await promptServeOptions(maybeDir, options);

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
      validityDays
    } = await promptKeystoreOptions(options);

    const result = await createKeystore({
      keystorePath,
      alias,
      storePassword,
      keyPassword,
      dname,
      validityDays
    });

    logger.success(`Keystore created: ${result.keystorePath}`);
    return;
  }

  if (cmd === "test") {
    const maybeDir = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { projectDir } = await promptTestOptions(maybeDir);

    await runProjectTests(projectDir);
    return;
  }

  if (cmd === "analyze") {
    const targetArg = argv[1] && !argv[1].startsWith("-") ? argv[1] : undefined;
    const { target } = await promptAnalyzeOptions(targetArg);

    await analyzeApk(target);
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main()
  .catch((error) => {
    logger.error(error?.message || String(error));
    process.exit(1);
  });
