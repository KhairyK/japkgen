/**
 * Splits Name.
 * @param {*} name
 * @returns {*}
 */
export function splitName(name = '') {
  return String(name)
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Capitalizes a value.
 * @param {*} value
 * @returns {*}
 */
export function capitalize(value = '') {
  const text = String(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

/**
 * Escapes Js Doc.
 * @param {*} text
 * @returns {*}
 */
export function escapeJsDoc(text = '') {
  return String(text)
    .replace(/\*\//g, '*\\/')
    .replace(/^\s+|\s+$/g, '');
}

/**
 * Strips Quotes.
 * @param {*} value
 * @returns {*}
 */
export function stripQuotes(value) {
  return String(value).replace(/^['"]|['"]$/g, '');
}

/**
 * Checks whether Identifier Like.
 * @param {*} value
 * @returns {*}
 */
export function isIdentifierLike(value) {
  return /^[A-Za-z_$][\w$]*$/.test(value);
}

/**
 * Firsts Defined.
 * @param {*} ...values
 * @returns {*}
 */
export function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/**
 * Formats Type.
 * @param {*} type
 * @returns {*}
 */
export function formatType(type) {
  if (!type) return '*';
  return String(type).replace(/\s+/g, ' ').trim();
}

/**
 * Indents a value.
 * @param {*} text
 * @param {*} spaces
 * @returns {*}
 */
export function indent(text, spaces = 1) {
  const pad = ' '.repeat(spaces);
  return String(text)
    .split('\n')
    .map(/**
   * Functions a value.
   * @param {*} line
   * @returns {*}
   */
  line => (line.length ? pad + line : line))
    .join('\n');
}
