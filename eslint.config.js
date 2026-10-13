import recommended from '@1stg/eslint-config'

export default [
  ...recommended,
  {
    ignores: [
      // fixtures intentionally contain invalid markup for the parser tests
      'packages/*/test/fixtures',
    ],
  },
]
