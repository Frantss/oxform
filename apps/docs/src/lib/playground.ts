export const frameworks = [
  { id: 'react', label: 'React' },
  { id: 'solid', label: 'Solid 1' },
  { id: 'solid-v2', label: 'Solid 2' },
] as const;
export type PlaygroundFramework = (typeof frameworks)[number]['id'];

const appSources = import.meta.glob<string>(
  [
    '../../../../examples/react/src/examples/*.{ts,tsx}',
    '../../../../examples/solid/src/examples/*.{ts,tsx}',
    '../../../../examples/solid-v2/src/examples/*.{ts,tsx}',
  ],
  { query: '?raw', import: 'default', eager: true },
);

const kitSources = import.meta.glob<string>('../../../../examples/kit/src/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export type Guide = { title: string; href: string };
export type PlaygroundExample = { id: string; label: string; description: string; guides: readonly Guide[] };
export type PlaygroundSearch = { framework: PlaygroundFramework; example: string };
export type SourceFile = { name: string; code: string };

type ExampleEntry = PlaygroundExample & {
  /** The files of the example app, in `examples/<framework>/src/examples`. A framework may not have each one. */
  appFiles: readonly string[];
  /** The framework-neutral files, in `examples/kit/src`. */
  kitFiles: readonly string[];
};

/** The five domain forms of the catalogue, each with the guides that explain it. */
const examples: readonly ExampleEntry[] = [
  {
    id: 'sign-in',
    label: 'Sign-in',
    description: 'A lean chain with the built-in slot groups. The server can refuse the password.',
    guides: [
      { title: 'Quick start', href: '/docs/quick-start' },
      { title: 'A lean form', href: '/docs/compose/lean-form' },
      { title: 'Errors from the server', href: '/docs/recipes/server-errors' },
      { title: 'A form without JavaScript', href: '/docs/recipes/form-without-javascript' },
    ],
    appFiles: ['sign-in.tsx'],
    kitFiles: ['sign-in.ts', 'sign-in-page.ts', 'sign-in-submit.ts'],
  },
  {
    id: 'checkout',
    label: 'Checkout',
    description: 'The standard preset, an address scope at billing and shipping, a card mask and dependent fields.',
    guides: [
      { title: 'Use the standard preset', href: '/docs/compose/standard-preset' },
      { title: 'A block used twice', href: '/docs/compose/repeated-block' },
      { title: 'Add members to fields', href: '/docs/extend/field-members' },
      { title: 'Dependent fields', href: '/docs/recipes/dependent-fields' },
      { title: 'A part with another element', href: '/docs/recipes/another-element' },
      { title: 'Read one value', href: '/docs/recipes/derived-ui' },
      { title: 'Errors from the server', href: '/docs/recipes/server-errors' },
    ],
    appFiles: [
      'checkout.tsx',
      'checkout-form.ts',
      'address-fields.tsx',
      'country-select.tsx',
      'region-select.tsx',
      'order-summary.tsx',
    ],
    kitFiles: ['checkout.ts', 'address.ts', 'masks.ts', 'payment-issues.ts', 'region.ts'],
  },
  {
    id: 'team-invites',
    label: 'Team invites',
    description: 'A house preset, rows of an array, a lookup on blur and a confirmation before an external invite.',
    guides: [
      { title: 'Rows of an array', href: '/docs/compose/array-rows' },
      { title: 'Your own preset', href: '/docs/compose/your-own-preset' },
      { title: 'A reusable slot group', href: '/docs/compose/slot-group' },
      { title: 'Replace a slot', href: '/docs/extend/replace-a-slot' },
      { title: 'Change a value before it is written', href: '/docs/extend/intercept-a-change' },
      { title: 'Refuse a submit', href: '/docs/extend/refuse-a-submit' },
      { title: 'Validate on the server on blur', href: '/docs/recipes/lookup-on-blur' },
      { title: 'Third-party controls', href: '/docs/recipes/third-party-controls' },
    ],
    appFiles: ['team-invites.tsx', 'team-invites-form.ts', 'member-list.tsx', 'member-row.tsx'],
    kitFiles: ['team-invites.ts', 'house-form.ts', 'member-list.ts', 'confirm-external.ts'],
  },
  {
    id: 'article-editor',
    label: 'Article editor',
    description: 'A draft saved as the writer types, advice on the title, unsaved changes and discard.',
    guides: [
      { title: 'Write an extension', href: '/docs/extend/write-an-extension' },
      { title: 'An option that takes the form', href: '/docs/extend/option-with-instance' },
      { title: 'Add a second check', href: '/docs/extend/second-check' },
      { title: 'Unsaved changes', href: '/docs/recipes/unsaved-changes' },
      { title: 'Discard changes', href: '/docs/recipes/discard-changes' },
    ],
    appFiles: ['article-editor.tsx', 'article-editor-form.ts', 'article-actions.tsx'],
    kitFiles: ['article-editor.ts', 'autosave.ts', 'warnings.ts', 'article-drafts.ts'],
  },
  {
    id: 'member-filter',
    label: 'Member filter',
    description: 'A filter bar with no validation and no submit. Its Root renders no element.',
    guides: [{ title: 'A form without validation', href: '/docs/compose/form-without-validation' }],
    appFiles: ['member-filter.tsx'],
    kitFiles: ['member-filter.ts'],
  },
];

export function examplesFor(_framework: PlaygroundFramework): readonly PlaygroundExample[] {
  return examples;
}

export function playgroundSearch(search: Record<string, unknown>): PlaygroundSearch {
  const framework = frameworks.find(entry => entry.id === search.framework)?.id ?? 'react';
  const example = examples.find(entry => entry.id === search.example)?.id ?? examples[0].id;
  return { framework, example };
}

/** The source files of one example: those of the framework's app, then those of the kit. */
export function sourceFiles(framework: PlaygroundFramework, example: string): SourceFile[] {
  const entry = examples.find(candidate => candidate.id === example) ?? examples[0];
  const app = entry.appFiles.flatMap(name => {
    const code = appSources['../../../../examples/' + framework + '/src/examples/' + name];
    return code === undefined ? [] : [{ name, code }];
  });
  const kit = entry.kitFiles.map(name => ({
    name: 'kit/' + name,
    code: kitSources['../../../../examples/kit/src/' + name],
  }));
  return [...app, ...kit];
}
