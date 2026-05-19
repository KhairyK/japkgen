const SKIP_KEYS = new Set([
  'loc',
  'start',
  'end',
  'range',
  'extra',
  'errors',
  'comments',
  'leadingComments',
  'trailingComments',
  'innerComments',
  'tokens'
]);

/**
 * Walks a value.
 * @param {*} node
 * @param {*} visitor
 * @param {*} state
 */
export function walk(node, visitor, state = {}) {
  const {
    parent = null,
    grandparent = null,
    key = null,
    index = null,
    path = [],
    ancestors = []
  } = state;

  if (!node || typeof node !== 'object') return;

  const current = { node, parent, grandparent, key, index, path, ancestors };
  if (visitor.enter) visitor.enter(current);

  const nextAncestors = ancestors.concat(node);
  const entries = Array.isArray(node) ? node.entries() : Object.entries(node);

  for (const entry of entries) {
    const childKey = Array.isArray(node) ? key : entry[0];
    const child = Array.isArray(node) ? entry[1] : entry[1];
    const childIndex = Array.isArray(node) ? entry[0] : null;

    if (!child || typeof child !== 'object') continue;
    if (!Array.isArray(node) && SKIP_KEYS.has(childKey)) continue;

    if (Array.isArray(child)) {
      child.forEach(/**
       * Functions a value.
       * @param {*} item
       * @param {*} i
       */
      (item, i) => {
        if (item && typeof item === 'object') {
          walk(item, visitor, {
            parent: node,
            grandparent: parent,
            key: childKey,
            index: i,
            path: path.concat(childKey, i),
            ancestors: nextAncestors
          });
        }
      });
      continue;
    }

    walk(child, visitor, {
      parent: node,
      grandparent: parent,
      key: childKey,
      index: childIndex,
      path: path.concat(childKey),
      ancestors: nextAncestors
    });
  }

  if (visitor.leave) visitor.leave(current);
}
