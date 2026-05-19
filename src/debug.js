/**
 * Debugs Log.
 * @param {*} namespace
 * @param {*} ...args
 */
export function debugLog(namespace, ...args) {
  if (!String(process.env.DEBUG || "").trim()) return;
  const prefix = `[${namespace}]`;
  console.log(prefix, ...args);
}
