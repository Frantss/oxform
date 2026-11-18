import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { createFileSystemTypesCache } from 'fumadocs-twoslash/cache-fs';
import { createFileSystemGeneratorCache, createGenerator, remarkAutoTypeTable } from 'fumadocs-typescript';
import { z } from 'zod';

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.cache/fumadocs-typescript'),
});

const entryPoints = [
  '@oxform/core',
  '@oxform/core/behaviors',
  '@oxform/core/presets',
  '@oxform/core/adapter',
  '@oxform/react',
  '@oxform/solid',
  '@oxform/solid/v2',
] as const;

const principles = ['composable', 'reusable', 'extensible', 'type-safe', 'lightweight'] as const;

const pageTypes = ['concept', 'guide', 'reference', 'extension', 'recipe', 'adapter', 'overview'] as const;

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    files: ['*.{md,mdx}', '{core,concepts,compose,extend,behaviors,presets,adapters,recipes,migration}/**/*.{md,mdx}'],
    schema: pageSchema.extend({
      description: z.string(),
      type: z.enum(pageTypes),
      entry: z.array(z.enum(entryPoints)),
      principles: z.array(z.enum(principles)),
      examples: z.array(z.string().regex(/^E\d{2}$/)),
    }),
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          typesCache: createFileSystemTypesCache(),
          twoslashOptions: {
            compilerOptions: {
              strict: true,
              jsx: 'react-jsx',
            },
          },
          langs: ['ts', 'tsx', 'js', 'jsx'],
        }),
      ],
    },
  },
});
