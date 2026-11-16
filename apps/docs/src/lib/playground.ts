export const frameworks = [
  { id: 'react', label: 'React' },
  { id: 'solid', label: 'Solid 1' },
  { id: 'solid-v2', label: 'Solid 2' },
] as const;
export type PlaygroundFramework = (typeof frameworks)[number]['id'];

const sources = import.meta.glob<string>(
  [
    '../../../../examples/react/src/playground.tsx',
    '../../../../examples/solid/src/playground.tsx',
    '../../../../examples/solid-v2/src/playground.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
);

export type PlaygroundExample = { id: string; label: string; description: string };
export type PlaygroundSearch = { framework: PlaygroundFramework; example: string };
export type SourceFile = { name: string; code: string };

const placeholderExamples: readonly PlaygroundExample[] = [
  { id: 'placeholder', label: 'Placeholder', description: 'The examples are being rewritten for Oxform 0.7.0.' },
];

export function examplesFor(_framework: PlaygroundFramework): readonly PlaygroundExample[] {
  return placeholderExamples;
}

export function playgroundSearch(search: Record<string, unknown>): PlaygroundSearch {
  const framework = frameworks.find(entry => entry.id === search.framework)?.id ?? 'react';
  const examples = examplesFor(framework);
  const example = examples.find(entry => entry.id === search.example)?.id ?? examples[0].id;
  return { framework, example };
}

export function sourceFiles(framework: PlaygroundFramework, _example: string): SourceFile[] {
  return [{ name: 'playground.tsx', code: sources['../../../../examples/' + framework + '/src/playground.tsx'] }];
}
