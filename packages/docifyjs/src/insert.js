import { walk } from './walker.js';
import { attachJsDoc } from './generator.js';
import { firstDefined } from './utils.js';

/**
 * Gets Name From Key.
 * @param {*} key
 * @param {*} source
 * @returns {*}
 */
function getNameFromKey(key, source) {
  if (!key) return null;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral' || key.type === 'Literal') return String(key.value);
  if (key.type === 'NumericLiteral') return String(key.value);
  if (typeof key.name === 'string') return key.name;
  if (typeof key.value === 'string') return key.value;
  if (source && key.start != null && key.end != null) return source.slice(key.start, key.end);
  return null;
}

/**
 * Gets Ts Inner Type Node.
 * @param {*} node
 * @returns {*}
 */
function getTsInnerTypeNode(node) {
  if (!node) return null;
  if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) return node.typeAnnotation.typeAnnotation;
  if (node.typeAnnotation && node.typeAnnotation.type) return node.typeAnnotation;
  if (node.returnType && node.returnType.typeAnnotation) return node.returnType.typeAnnotation;
  if (node.returnType && node.returnType.type) return node.returnType;
  return null;
}

/**
 * Extracts Ts Type.
 * @param {*} node
 * @param {*} source
 * @returns {*}
 */
function extractTsType(node, source) {
  const inner = getTsInnerTypeNode(node);
  if (inner && typeof inner.start === 'number' && typeof inner.end === 'number') {
    return source.slice(inner.start, inner.end).trim();
  }
  if (node.type === 'TSParameterProperty' && node.parameter) {
    return extractTsType(node.parameter, source);
  }
  return null;
}

/**
 * Infers Literal Type.
 * @param {*} node
 * @param {*} source
 * @returns {*}
 */
function inferLiteralType(node, source) {
  if (!node) return '*';
  switch (node.type) {
    case 'NumericLiteral':
    case 'BigIntLiteral':
      return 'number';
    case 'StringLiteral':
      return 'string';
    case 'BooleanLiteral':
      return 'boolean';
    case 'NullLiteral':
      return 'null';
    case 'Identifier':
      if (node.name === 'undefined') return 'void';
      return '*';
    case 'ArrayExpression':
      return 'Array';
    case 'ObjectExpression':
      return 'Object';
    case 'TemplateLiteral':
      return 'string';
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'Function';
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
      return inferLiteralType(node.expression, source);
    case 'BinaryExpression':
      if (['+', '-', '*', '/', '%', '**', '<<', '>>', '>>>', '|', '&', '^'].includes(node.operator)) return 'number';
      if (['==', '!=', '===', '!==', '>', '>=', '<', '<=', 'instanceof', 'in'].includes(node.operator)) return 'boolean';
      return '*';
    case 'LogicalExpression':
      return '*';
    case 'UnaryExpression':
      if (['!', '!!'].includes(node.operator)) return 'boolean';
      if (['+', '-', '~'].includes(node.operator)) return 'number';
      return '*';
    case 'ConditionalExpression': {
      const consequentType = inferLiteralType(node.consequent, source);
      const alternateType = inferLiteralType(node.alternate, source);
      return consequentType === alternateType ? consequentType : '*';
    }
    case 'CallExpression':
      return '*';
    default:
      if (typeof node.start === 'number' && typeof node.end === 'number' && source) {
        const raw = source.slice(node.start, node.end);
        if (/^['"]/u.test(raw)) return 'string';
        if (/^\d/u.test(raw)) return 'number';
      }
      return '*';
  }
}

/**
 * Collects Returns.
 * @param {*} fnNode
 * @param {*} source
 * @returns {*}
 */
function collectReturns(fnNode, source) {
  const returns = [];

  /**
   * Visits a value.
   * @param {*} node
   */
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      node !== fnNode &&
      [
        'FunctionDeclaration',
        'FunctionExpression',
        'ArrowFunctionExpression',
        'ObjectMethod',
        'ClassMethod',
        'ClassPrivateMethod'
      ].includes(node.type)
    ) {
      return;
    }

    if (node.type === 'ReturnStatement') {
      if (node.argument) returns.push(inferLiteralType(node.argument, source));
      else returns.push('void');
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (
        ['loc', 'start', 'end', 'range', 'extra', 'errors', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'tokens'].includes(key)
      ) {
        continue;
      }
      if (!value || typeof value !== 'object') continue;
      if (Array.isArray(value)) {
        for (const item of value) visit(item);
      } else {
        visit(value);
      }
    }
  }

  visit(fnNode.body || fnNode);
  return returns.filter(Boolean);
}

/**
 * Infers Expression Body.
 * @param {*} fnNode
 * @param {*} source
 * @returns {*}
 */
function inferExpressionBody(fnNode, source) {
  if (!fnNode.body) return null;
  if (fnNode.body.type === 'BlockStatement') {
    const returns = collectReturns(fnNode, source);
    if (!returns.length) return fnNode.async ? 'Promise<void>' : 'void';
    const unique = [...new Set(returns)];
    return unique.length === 1 ? unique[0] : '*';
  }
  return inferLiteralType(fnNode.body, source);
}

/**
 * Normalizes Returns.
 * @param {*} fnNode
 * @param {*} source
 * @param {*} inferred
 * @returns {*}
 */
function normalizeReturns(fnNode, source, inferred) {
  if (fnNode.async) {
    if (inferred && /^Promise<.*>$/.test(inferred)) return inferred;
    const inner = inferred && inferred !== '*' ? inferred : inferExpressionBody(fnNode, source);
    return `Promise<${inner || 'void'}>`;
  }
  if (inferred && inferred !== '*') return inferred;
  return inferExpressionBody(fnNode, source) || '*';
}

/**
 * Infers Param Type.
 * @param {*} param
 * @returns {*}
 */
function inferParamType(param) {
  if (!param) return '*';
  if (param.type === 'Identifier') return '*';
  if (param.type === 'ObjectPattern') return 'Object';
  if (param.type === 'ArrayPattern') return 'Array';
  if (param.type === 'RestElement') return inferParamType(param.argument);
  if (param.type === 'AssignmentPattern') return inferParamType(param.left);
  return '*';
}

/**
 * Gets Param Info.
 * @param {*} param
 * @param {*} source
 * @returns {*}
 */
function getParamInfo(param, source) {
  if (!param) return null;

  if (param.type === 'RestElement') {
    const arg = getParamInfo(param.argument, source);
    return arg ? { ...arg, name: `...${arg.name}` } : null;
  }

  if (param.type === 'AssignmentPattern') {
    return getParamInfo(param.left, source);
  }

  if (param.type === 'TSParameterProperty') {
    return getParamInfo(param.parameter, source);
  }

  const name = firstDefined(
    param.type === 'Identifier' ? param.name : null,
    getNameFromKey(param.key, source)
  );

  const tsType = extractTsType(param, source);
  const inferredType = tsType || inferParamType(param);

  return {
    name: name || 'param',
    type: inferredType || '*'
  };
}

/**
 * Gets Export Ancestor.
 * @param {*} ancestors
 * @returns {*}
 */
function getExportAncestor(ancestors = []) {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const ancestor = ancestors[i];
    if (!ancestor) continue;
    if (ancestor.type === 'ExportNamedDeclaration' || ancestor.type === 'ExportDefaultDeclaration') {
      return ancestor;
    }
  }
  return null;
}

/**
 * Shoulds Hoist To Export.
 * @param {*} node
 * @param {*} targetNode
 * @returns {boolean}
 */
function shouldHoistToExport(node, targetNode) {
  if (!node || !targetNode) return false;

  if (node.type === 'FunctionDeclaration' || node.type === 'TSDeclareFunction') {
    return true;
  }

  if (
    (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') &&
    targetNode.type === 'VariableDeclaration'
  ) {
    return true;
  }

  return false;
}

/**
 * Gets Function Info.
 * @param {*} node
 * @param {*} parent
 * @param {*} grandparent
 * @param {*} source
 * @param {*} ancestors
 * @returns {Object}
 */
function getFunctionInfo(node, parent, grandparent, source, ancestors = []) {
  let name = null;
  let targetNode = node;
  let kind = node.type;

  if (node.type === 'FunctionDeclaration') {
    name = node.id?.name || null;
  } else if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    if (parent?.type === 'VariableDeclarator') {
      name = getNameFromKey(parent.id, source);
      targetNode = grandparent?.type === 'VariableDeclaration' ? grandparent : parent;
      kind = 'VariableDeclaration';
    } else if (parent?.type === 'AssignmentExpression') {
      name = getNameFromKey(parent.left, source);
      targetNode = parent;
    } else if (parent?.type === 'ObjectProperty' || parent?.type === 'ObjectMethod') {
      name = getNameFromKey(parent.key, source);
      targetNode = parent;
    } else if (parent?.type === 'ClassProperty' || parent?.type === 'PropertyDefinition') {
      name = getNameFromKey(parent.key, source);
      targetNode = parent;
    } else if (parent?.type === 'ExportDefaultDeclaration') {
      name = 'default';
      targetNode = parent;
    }
  } else if (node.type === 'ObjectMethod' || node.type === 'ClassMethod' || node.type === 'ClassPrivateMethod') {
    name = getNameFromKey(node.key, source);
  } else if (node.type === 'TSDeclareFunction') {
    name = node.id?.name || null;
  }

  const exportAncestor = shouldHoistToExport(node, targetNode) ? getExportAncestor(ancestors) : null;
  if (exportAncestor) {
    targetNode = exportAncestor;
  }

  const params = (node.params || []).map(/**
   * Functions a value.
   * @param {*} param
   * @returns {*}
   */
  param => getParamInfo(param, source)).filter(Boolean);
  const tsReturn = extractTsType(node.returnType || node, source);
  const returns = tsReturn || normalizeReturns(node, source, inferExpressionBody(node, source));

  return {
    name: name || 'function',
    kind,
    targetNode,
    params,
    returns: returns === 'void' ? null : returns,
    async: !!node.async,
    generator: !!node.generator,
    description: null
  };
}

/**
 * Generates Docs.
 * @param {*} ast
 * @param {*} source
 * @param {Object} param
 * @returns {*}
 */
export function generateDocs(ast, source, { plugins = [], ai = {}, overwrite = false } = {}) {
  const results = [];

  walk(ast, {
    /**
     * Enters a value.
     * @param {Object} param
     */
    enter({ node, parent, grandparent, ancestors }) {
      const interesting = new Set([
        'FunctionDeclaration',
        'FunctionExpression',
        'ArrowFunctionExpression',
        'ObjectMethod',
        'ClassMethod',
        'ClassPrivateMethod',
        'TSDeclareFunction'
      ]);

      if (!interesting.has(node.type)) return;

      const info = getFunctionInfo(node, parent, grandparent, source, ancestors);
      const support = plugins.every(/**
       * Functions a value.
       * @param {*} plugin
       * @returns {*}
       */
      plugin => {
        if (typeof plugin.supports === 'function') return plugin.supports(info, { node, parent, grandparent, source });
        return true;
      });
      if (!support) return;

      const context = { node, parent, grandparent, source, info };
      for (const plugin of plugins) {
        if (typeof plugin.description === 'function') {
          const value = plugin.description(info, context);
          if (typeof value === 'string' && value.trim()) {
            info.description = value.trim();
            break;
          }
        }
      }

      if (!info.description) {
        for (const plugin of plugins) {
          if (typeof plugin.resolveDescription === 'function') {
            const value = plugin.resolveDescription(info, context);
            if (typeof value === 'string' && value.trim()) {
              info.description = value.trim();
              break;
            }
          }
        }
      }

      if (!info.description && ai.enabled) {
        info.description = ai.description || null;
      }

      if (info.targetNode) {
        attachJsDoc(info.targetNode, info, { overwrite });
        results.push(info);
      }
    }
  });

  return results;
}
