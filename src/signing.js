import path from 'node:path';
import fs from 'fs-extra';
import prompts from 'prompts';
import { writeFileEnsured } from './utils.js';
import /**
 * @typedef {import('./types.js').SigningOptions} SigningOptions
 */ './types.js';

/**
 * Take the signing config from the CLI / prompt
 *
 * @param {Object} cliOptions
 * @returns {Promise<SigningOptions>}
 */
export async function pickSigningOptions(cliOptions = {}) {
  const shouldAsk = cliOptions.signing == null;

  let result = {};
  if (shouldAsk) {
    result = await prompts(
      [
        {
          type: 'confirm',
          name: 'signing',
          message: 'Enable release signing?',
          initial: false
        }
      ],
      {
        onCancel: () => process.exit(1)
      }
    );
  }

  const signingEnabled = Boolean(cliOptions.signing ?? result.signing);

  if (!signingEnabled) {
    return { signingEnabled: false };
  }

  const fields = [];
  if (!cliOptions.keystore) {
    fields.push({
      type: 'text',
      name: 'keystore',
      message: 'Keystore file path',
      initial: './release.keystore'
    });
  }
  if (!cliOptions.keyAlias) {
    fields.push({
      type: 'text',
      name: 'keyAlias',
      message: 'Key alias',
      initial: 'release'
    });
  }
  if (!cliOptions.storePassword) {
    fields.push({
      type: 'password',
      name: 'storePassword',
      message: 'Store password'
    });
  }
  if (!cliOptions.keyPassword) {
    fields.push({
      type: 'password',
      name: 'keyPassword',
      message: 'Key password'
    });
  }

  const signingData = fields.length
    ? await prompts(fields, {
        onCancel: () => process.exit(1)
      })
    : {};

  return {
    signingEnabled: true,
    keystore: cliOptions.keystore || signingData.keystore,
    keyAlias: cliOptions.keyAlias || signingData.keyAlias,
    storePassword: cliOptions.storePassword || signingData.storePassword,
    keyPassword: cliOptions.keyPassword || signingData.keyPassword
  };
}

export async function writeSigningFiles(projectDir, signing) {
  if (!signing?.signingEnabled) return;

  const relKeystore = String(signing.keystore || '').trim();
  if (!relKeystore) {
    throw new Error('Keystore path is required for signing.');
  }

  const resolvedKeystore = path.isAbsolute(relKeystore)
    ? relKeystore
    : path.resolve(projectDir, relKeystore);

  if (!(await fs.pathExists(resolvedKeystore))) {
    throw new Error(`Keystore file not found: ${resolvedKeystore}`);
  }

  const props = [
    `storeFile=${relKeystore.replaceAll('\\', '/')}`,
    `storePassword=${signing.storePassword}`,
    `keyAlias=${signing.keyAlias}`,
    `keyPassword=${signing.keyPassword}`
  ].join('\n') + '\n';

  await writeFileEnsured(path.join(projectDir, 'keystore.properties'), props);
}