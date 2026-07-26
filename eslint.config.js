import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public/sw.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Security-relevant guardrails for a no-backend, user-data-in-the-browser app.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  {
    files: ['vite.config.ts', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Tests deliberately feed hostile-looking strings (javascript: URLs, script
    // tags) to the validators to prove they are neutralised.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-script-url': 'off' },
  },
);
