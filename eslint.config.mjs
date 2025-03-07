import antfu from '@antfu/eslint-config'

export default antfu(
  {
    markdown: false,
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'antfu/no-top-level-await': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },
)
