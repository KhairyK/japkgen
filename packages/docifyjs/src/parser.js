import * as babelParser from '@babel/parser';

const BASE_PLUGINS = [
  'jsx',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'decorators-legacy',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'optionalChaining',
  'nullishCoalescingOperator',
  'topLevelAwait',
  'objectRestSpread'
];

const TS_PLUGINS = ['typescript'];

/**
 * Creates Parser.
 * @param {Object} param
 * @returns {Object}
 */
export function createParser({ filename = 'input.js' } = {}) {
  const isTypeScript = /\.(ts|tsx|mts|cts)$/i.test(filename);
  const plugins = isTypeScript ? [...BASE_PLUGINS, ...TS_PLUGINS] : [...BASE_PLUGINS];

  return {
    /**
     * Parses a value.
     * @param {*} source
     * @returns {*}
     */
    parse(source) {
      return babelParser.parse(source, {
        sourceType: 'unambiguous',
        sourceFilename: filename,
        allowReturnOutsideFunction: true,
        errorRecovery: true,
        plugins
      });
    }
  };
}
