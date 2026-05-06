const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const nestjsPlugin = require('eslint-plugin-nestjs');

const nodeAndJestGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  jest: 'readonly',
  module: 'readonly',
  process: 'readonly',
  require: 'readonly',
  __dirname: 'readonly',
};

module.exports = [
  {
    ignores: ['coverage/**', 'dist/**', 'node_modules/**', '.eslintrc.js'],
  },
  ...tsEslintPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: nodeAndJestGlobals,
    },
    plugins: {
      nestjs: nestjsPlugin,
    },
    rules: {
      ...nestjsPlugin.configs.recommended.rules,
    },
  },
];
