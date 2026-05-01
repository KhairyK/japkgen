#!/usr/bin/env node

import process from 'node:process';
import { Command } from 'commander';
import pc from 'picocolors';

import { DEFAULTS } from './constants.js';
import { generateProject } from './generator.js';
import { buildProject } from './build.js';
import { runDoctor } from './doctor.js';

const program = new Command();

program
  .name('japkgen')
  .description('Java APK project generator')
  .version('0.2.0');

program
  .command('new')
  .alias('init')
  .description('Generate a new Android project')
  .option('--name <name>', 'App name')
  .option('--package <package>', 'Package name')
  .option('--template <template>', 'webview or native')
  .option('--min-sdk <number>', 'Min SDK', (v) => Number(v))
  .option('--target-sdk <number>', 'Target SDK', (v) => Number(v))
  .option('--compile-sdk <number>', 'Compile SDK', (v) => Number(v))
  .option('--url <url>', 'WebView URL')
  .option('--permissions <list>', 'Comma separated permissions')
  .option('--icon <path>', 'Icon path (png/svg/jpeg)')
  .option('--signing', 'Enable release signing')
  .option('--keystore <path>', 'Keystore file path')
  .option('--key-alias <alias>', 'Key alias')
  .option('--store-password <password>', 'Store password')
  .option('--key-password <password>', 'Key password')
  .action(async (options) => {
    await generateProject(options);
  });

program
  .command('build [projectDir]')
  .description('Build APK in a project directory')
  .option('--variant <variant>', 'debug or release', 'debug')
  .option('--gradle-version <version>', 'Gradle version for wrapper bootstrap', DEFAULTS.gradleVersion)
  .action(async (projectDir, options) => {
    await buildProject(projectDir, options);
  });

program
  .command('doctor')
  .description('Check Android build environment')
  .action(async () => {
    await runDoctor();
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(pc.red(`\n${error.message || error}`));
  process.exit(1);
});