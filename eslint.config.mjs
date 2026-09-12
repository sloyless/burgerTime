import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import eslintPluginTailwindcss from 'eslint-plugin-tailwindcss';
const unusedVarsRule = [
  'error',
  {
    argsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginTailwindcss.configs['flat/recommended'] ??
    eslintPluginTailwindcss.configs.recommended,
  {
    plugins: {
      tailwindcss: eslintPluginTailwindcss,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: './src/styles/globals.css',
      },
    },
    rules: {
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/no-custom-classname': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-unused-vars': unusedVarsRule,
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/display-name': 'off',
      'react/jsx-boolean-value': 'off',
      'react/jsx-closing-bracket-location': 'off',
      'react/jsx-no-comment-textnodes': 'warn',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'warn',
      'react/jsx-sort-props': 'off',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/no-did-mount-set-state': 'off',
      'react/no-did-update-set-state': 'off',
      'react/no-multi-comp': 'off',
      'react/no-string-refs': 'warn',
      'react/no-unknown-property': 'warn',
      'react/no-unused-class-component-methods': 'warn',
      'react/no-unused-state': 'warn',
      'react/prop-types': 'off',
      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['.ts', '.tsx'],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
            properties: false,
          },
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.firebase/**',
    '.github/**',
    'node_modules/**',
    'public/**',
    'functions/**',
    'prettier.config.js',
    'postcss.config.js',
  ]),
]);
