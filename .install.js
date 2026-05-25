#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

function log(msg) {
  console.log(`[JAPKGEN] ${msg}`);
}

function error(msg) {
  console.error(`[JAPKGEN ERROR] ${msg}`);
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);

  if (major < 20) {
    error(`Node.js 20+ required. Current: v${process.versions.node}`);
    process.exit(1);
  }

  log(`Node.js version OK (${process.versions.node})`);
}

function detectPlatform() {
  const platform = os.platform();

  log(`Platform: ${platform}`);

  switch (platform) {
    case 'win32':
      log('Windows detected');
      break;

    case 'linux':
      log('Linux detected');
      break;

    case 'darwin':
      log('macOS detected');
      break;

    default:
      log('Unknown platform');
  }
}

function createConfig() {
  const configPath = path.join(process.cwd(), 'japkgen.config.json');

  if (fs.existsSync(configPath)) {
    log('Config already exists');
    return;
  }

  const config = {
    sdk: null,
    templates: true,
    analytics: false
  };

  fs.writeFileSync(
    configPath,
    JSON.stringify(config, null, 2)
  );

  log('Created japkgen.config.json');
}

function main() {
  console.clear();

  log('Starting installer...\n');

  checkNodeVersion();
  detectPlatform();
  createConfig();

  log('\nSetup complete 🚀');
}

main();