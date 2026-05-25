import path from "node:path";
import { writeFileEnsured, runCommand } from "./utils.js";
import { logger } from "./logger.js";
import { DEFAULTS } from "./constants.js";

/**
 * Sanitizes Alias.
 * @param {*} input
 * @returns {*}
 */
export function sanitizeAlias(input = "") {
  return (
    String(input)
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9._-]/g, "_") || DEFAULTS.keystoreAlias
  );
}

/**
 * Writes Signing Files.
 * @param {*} projectDir
 * @param {*} signing
 * @returns {Promise<*>}
 */
export async function writeSigningFiles(projectDir, signing) {
  if (!signing?.signingEnabled) return null;

  const relKeystore = String(signing.keystore || DEFAULTS.keystoreFile).trim();
  const props =
    [
      `storeFile=${relKeystore.replaceAll("\\", "/")}`,
      `storePassword=${signing.storePassword || DEFAULTS.keystoreStorePassword}`,
      `keyAlias=${signing.keyAlias || DEFAULTS.keystoreAlias}`,
      `keyPassword=${signing.keyPassword || DEFAULTS.keystoreKeyPassword}`,
    ].join("\n") + "\n";

  await writeFileEnsured(path.join(projectDir, "keystore.properties"), props);
  return path.join(projectDir, "keystore.properties");
}

/**
 * Creates Keystore.
 * @param {Object} param
 * @returns {Promise<Object>}
 */
export async function createKeystore(
  {
    keystorePath,
    alias,
    storePassword,
    keyPassword,
    dname,
    validityDays = 10000,
  }
) {
  const resolved = path.resolve(keystorePath);
  const args = [
    "-genkeypair",
    "-alias",
    alias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    String(validityDays),
    "-keystore",
    resolved,
    "-storepass",
    storePassword,
    "-keypass",
    keyPassword,
    "-dname",
    dname,
    "-storetype",
    "JKS",
  ];

  const result = await runCommand("keytool", args, { reject: false });
  if (!result.ok) {
    throw new Error(
      result.stderr ||
        result.stdout ||
        "Failed to create the keystore. Ensure that keytool is available."
    );
  }
  return {
    keystorePath: resolved,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
