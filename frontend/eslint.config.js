import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import reactPlugin from '@eslint-react/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default [
    {
        ignores: ['dist/**', '.vscode/**', '.idea/**', '*.config.js'],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json'],
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        ...reactPlugin.configs.recommended,
        plugins: {
            ...reactPlugin.configs.recommended.plugins,
            'react-refresh': pluginReactRefresh,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            'react-refresh/only-export-components': 'off',
            'react/react-in-jsx-scope': 'off',
        },
    },
    {
        files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.vitest,
            },
        },
    },
    prettierConfig,
    {
        files: ['src/**/*.{ts,tsx,js,jsx}'],
        plugins: {
            'better-tailwindcss': betterTailwindcss,
        },
        settings: {
            'better-tailwindcss': {
                entryPoint: 'src/index.css',
                rootFontSize: 16,
            },
        },
        rules: {
            'better-tailwindcss/no-duplicate-classes': 'warn',
            'better-tailwindcss/no-conflicting-classes': 'error',
            'better-tailwindcss/enforce-shorthand-classes': 'error',
            'better-tailwindcss/enforce-canonical-classes': 'error',
            'better-tailwindcss/no-unknown-classes': 'error',
            'better-tailwindcss/no-unnecessary-whitespace': 'warn',
        },
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
        rules: {
            '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
            '@typescript-eslint/consistent-type-assertions': ['warn', { assertionStyle: 'never' }],
            '@typescript-eslint/no-non-null-assertion': 'warn',
            'no-restricted-syntax': [
                'warn',
                {
                    selector: 'ExportDefaultDeclaration',
                    message: 'export default は使わず、名前付きエクスポートにする。',
                },
                {
                    selector:
                        "TSTypeReference[typeName.left.name='React'][typeName.right.name=/^(FC|VFC|FunctionComponent)$/]",
                    message: 'React.FC は使わず、props に型注釈を付けた通常の関数で書く。',
                },
            ],
        },
    },
];
