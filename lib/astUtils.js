const PURE_ANNOTATION = '#__PURE__';

/**
 * @template {import('@babel/core').types.Node} N
 * @param {typeof import('@babel/core').types} t
 * @param {N} node
 * @returns {N}
 */
const annotateAsPure = (t, node) => {
  t.addComment(node, 'leading', PURE_ANNOTATION);
  return node;
};

module.exports = {
  annotateAsPure,
};
