import recast from 'recast';
import { createAIDescription } from './ai.js';
import { escapeJsDoc, formatType, firstDefined, indent } from './utils.js';

/**
 * Creates Comment.
 * @param {*} lines
 * @returns {*}
 */
function makeComment(lines) {
  const block = ['*'];
  for (const line of lines) {
    block.push(` * ${line}`.replace(/\s+$/g, ''));
  }
  block.push(' ');
  return recast.types.builders.commentBlock(block.join('\n'), true, false);
}

/**
 * Builds Doc Text.
 * @param {*} info
 * @param {*} options
 * @returns {*}
 */
export function buildDocText(info, options = {}) {
  const lines = [];
  const description = firstDefined(info.description, createAIDescription(info, options.ai), 'Performs an operation.');
  if (description) lines.push(escapeJsDoc(description));

  for (const param of info.params || []) {
    const type = formatType(param.type || '*');
    const name = param.name || 'param';
    const desc = param.description ? ` - ${escapeJsDoc(param.description)}` : '';
    lines.push(`@param {${type}} ${name}${desc}`);
  }

  if (info.returns) {
    lines.push(`@returns {${formatType(info.returns)}}`);
  }

  if (info.template) {
    lines.push(`@template ${info.template}`);
  }

  return lines;
}

/**
 * Builds Js Doc.
 * @param {*} info
 * @param {*} options
 * @returns {*}
 */
export function buildJsDoc(info, options = {}) {
  const lines = buildDocText(info, options);
  return makeComment(lines);
}

/**
 * Attachs Js Doc.
 * @param {*} targetNode
 * @param {*} info
 * @param {*} options
 */
export function attachJsDoc(targetNode, info, options = {}) {
  const comment = buildJsDoc(info, options);
  const existing = Array.isArray(targetNode.comments) ? targetNode.comments : [];
  if (options.overwrite) {
    targetNode.comments = [comment];
  } else {
    const hasDoc = existing.some(/**
     * Functions a value.
     * @param {*} item
     * @returns {*}
     */
    item => item?.type === 'CommentBlock' && String(item.value || '').includes('*'));
    targetNode.comments = hasDoc ? existing : [comment, ...existing];
  }
}
