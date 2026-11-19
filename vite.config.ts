import { playwright } from 'vite-plus/test/browser-playwright';
import type { OxlintOverride } from 'vite-plus/lint';
import { defineConfig } from 'vite-plus';

const coreBarrels = ['#core', '#core/*'];

const restrictImports = (
  files: string[],
  group: string[],
  options: { allowTypeImports?: boolean } = {},
): OxlintOverride => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group, ...options, message: 'This import goes against the dependency direction of the package areas.' },
        ],
      },
    ],
  },
});

export const base = defineConfig({
  lint: {
    ignorePatterns: ['dist/**', 'node_modules/**', 'explorations/**'],
    plugins: ['oxc', 'typescript', 'import', 'promise', 'react', 'react-perf'],
    env: {
      browser: true,
    },
    rules: {
      'typescript/no-base-to-string': 'off',
    },
    overrides: [
      {
        files: ['packages/solid*/**/*.{ts,tsx}', 'examples/solid*/**/*.{ts,tsx}'],
        rules: { 'react/refs': 'off' },
      },
      { files: ['packages/**/*.{ts,tsx}'], rules: { 'import/no-cycle': 'error' } },
      // The dependency direction of the core areas (docs/structure.md, "Source Organization"). A later override replaces
      // the rule options of an earlier one, so each file matches one of these entries.
      restrictImports(['packages/core/src/internal/**'], ['#main/*', '#behaviors/*', '#presets/*', ...coreBarrels]),
      restrictImports(['packages/core/src/main/**'], ['#behaviors/*', '#presets/*', ...coreBarrels], {
        allowTypeImports: true,
      }),
      restrictImports(['packages/core/src/behaviors/**'], ['#presets/*', ...coreBarrels], { allowTypeImports: true }),
      // A spec of a main module may build a chain with the built-in behaviors. It is not shipped.
      restrictImports(['packages/core/src/main/**/*.spec.ts'], ['#presets/*', ...coreBarrels]),
      restrictImports(
        ['packages/core/src/presets/**'],
        ['#main/*', '#behaviors/*', '#internal/*', '#core/adapter', './**', '../**'],
      ),
      // A spec of a preset may read the slots of its form through the adapter entry. It is not shipped.
      restrictImports(
        ['packages/core/src/presets/**/*.spec.ts'],
        ['#main/*', '#behaviors/*', '#internal/*', './**', '../**'],
      ),
      restrictImports(['packages/core/tests/**'], ['#main/*', '#behaviors/*', '#presets/*', '#internal/*']),
      restrictImports(
        ['packages/{react,solid-v1,solid-v2}/src/**'],
        ['@oxform/core/presets', '@oxform/core/behaviors'],
        {
          allowTypeImports: true,
        },
      ),
      // A spec of an adapter may build its form with the built-in behaviors. It is not shipped.
      {
        files: ['packages/{react,solid-v1,solid-v2}/src/**/*.spec.{ts,tsx}'],
        rules: { 'no-restricted-imports': 'off' },
      },
      restrictImports(
        ['packages/adapter-parity/**'],
        [
          'react',
          'react/*',
          'react-dom',
          'react-dom/*',
          'solid-js',
          'solid-js/*',
          '@solidjs/*',
          '@oxform/react',
          '@oxform/solid*',
        ],
      ),
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    // The parity snapshots are server HTML as an adapter renders it, byte for byte.
    ignorePatterns: ['apps/docs/src/routeTree.gen.ts', 'packages/adapter-parity/src/snapshots/**'],
    arrowParens: 'avoid' as const,
    singleQuote: true,
    jsxSingleQuote: true,
    printWidth: 120,
    objectWrap: 'preserve' as const,
    overrides: [
      {
        files: ['*.spec.ts', '*.spec.tsx'],
        options: {
          printWidth: 150,
        },
      },
    ],
  },
  test: {
    browser: {
      provider: playwright({}),
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' as const }],
      viewport: { width: 1280, height: 720 },
    },
    globals: false,
    coverage: {
      enabled: false,
      reporter: 'html' as const,
      provider: 'v8' as const,
    },
    include: ['**/*.spec.{ts,tsx}'],
  },
});

export default base;
