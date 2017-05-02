module.exports = {
  root: true,
  env: {
    node: true
  },
  globals: {
    'describe': false,
    'it': false
  },
  extends: 'standard',
  'rules': {
    'arrow-parens': 0,
    'prefer-const': ['error', {
      'destructuring': 'any',
      'ignoreReadBeforeAssign': false
    }],
    'space-before-function-paren': ['error', {
      'anonymous': 'ignore',
      'named': 'ignore',
      'asyncArrow': 'ignore'
    }]
  }
}
