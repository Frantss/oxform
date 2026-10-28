import { reactExamples } from '../../../../examples/react/src/catalog';

export const frameworks = [
  { id: 'react', label: 'React' },
  { id: 'solid', label: 'Solid 1' },
  { id: 'solid-v2', label: 'Solid 2' },
] as const;
export type PlaygroundFramework = (typeof frameworks)[number]['id'];

const sources = import.meta.glob<string>(
  [
    '../../../../examples/react/src/examples/*.tsx',
    '../../../../examples/react/src/components/*.tsx',
    '../../../../examples/solid/src/app.tsx',
    '../../../../examples/solid-v2/src/app.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
);

export type PlaygroundExample = { id: string; label: string; description: string };
export type PlaygroundSearch = { framework: PlaygroundFramework; example: string };
export type SourceFile = { name: string; code: string };

const accountExamples: readonly PlaygroundExample[] = [
  {
    id: 'account',
    label: 'Account form',
    description: 'Validation, warnings, keyed members, checkbox handling, subscriptions, and effects.',
  },
];

export function examplesFor(framework: PlaygroundFramework): readonly PlaygroundExample[] {
  return framework === 'react' ? reactExamples : accountExamples;
}

export function playgroundSearch(search: Record<string, unknown>): PlaygroundSearch {
  const framework = frameworks.find(entry => entry.id === search.framework)?.id ?? 'react';
  const examples = examplesFor(framework);
  const example = examples.find(entry => entry.id === search.example)?.id ?? examples[0].id;
  return { framework, example };
}

export function sourceFiles(framework: PlaygroundFramework, example: string): SourceFile[] {
  if (framework !== 'react') {
    return [{ name: 'app.tsx', code: sources['../../../../examples/' + framework + '/src/app.tsx'] }];
  }
  return [
    {
      name: 'examples/' + example + '.tsx',
      code: sources['../../../../examples/react/src/examples/' + example + '.tsx'],
    },
    ...Object.entries(sources)
      .filter(([path]) => path.includes('/react/src/components/') && !path.endsWith('/example-tabs.tsx'))
      .map(([path, code]) => ({ name: path.split('/src/')[1], code })),
  ];
}
