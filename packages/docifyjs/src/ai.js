import { capitalize, splitName } from './utils.js';

const VERB_MAP = new Map([
  ['get', 'Gets'],
  ['set', 'Sets'],
  ['create', 'Creates'],
  ['build', 'Builds'],
  ['make', 'Creates'],
  ['add', 'Adds'],
  ['multiply', 'Multiplies'],
  ['remove', 'Removes'],
  ['delete', 'Deletes'],
  ['update', 'Updates'],
  ['find', 'Finds'],
  ['fetch', 'Fetches'],
  ['load', 'Loads'],
  ['save', 'Saves'],
  ['parse', 'Parses'],
  ['format', 'Formats'],
  ['generate', 'Generates'],
  ['render', 'Renders'],
  ['check', 'Checks'],
  ['validate', 'Validates'],
  ['is', 'Checks whether'],
  ['has', 'Checks whether']
]);

/**
 * Creates Smart Description.
 * @param {*} info
 * @returns {string}
 */
export function createSmartDescription(info) {
  const name = info?.name || 'function';
  const parts = splitName(name);
  if (!parts.length) return 'Performs an operation.';

  const [head, ...tail] = parts;
  const verb = VERB_MAP.get(head.toLowerCase()) || `${capitalize(head)}s`;

  if (head.toLowerCase() === 'is' || head.toLowerCase() === 'has') {
    const subject = tail.length ? tail.join(' ') : 'a condition';
    return `${verb} ${subject}.`;
  }

  const subject = tail.length ? tail.join(' ') : 'a value';
  return `${verb} ${subject}.`;
}

/**
 * Creates AIDescription.
 * @param {*} info
 * @param {*} options
 * @returns {*}
 */
export function createAIDescription(info, options = {}) {
  const mode = options.provider || 'local';

  if (mode === 'local') {
    return createSmartDescription(info);
  }

  // Optional remote provider hook. Kept offline-safe by design: if the
  // environment does not provide a provider, it falls back to local text.
  if (typeof mode === 'function') {
    const result = mode(info);
    if (typeof result === 'string' && result.trim()) return result.trim();
  }

  return createSmartDescription(info);
}
