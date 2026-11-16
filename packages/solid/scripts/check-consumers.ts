import { checkConsumers } from '../../../scripts/check-consumer.ts';

const source = (entry: string) => `
import { defineForm } from '@oxform/core';
import { createParts } from '${entry}';

if (createParts(defineForm({ schema: { "~standard": { version: 1, vendor: "test", validate: (value: unknown) => ({ value }) } }, defaultValues: {} })).slots.length !== 0) throw new Error('A form with no extension has no slot.');
// A type case only: it is never called.
export const rejected = () => {
  // @ts-expect-error createParts takes a form.
  createParts('form');
};
`;

await checkConsumers(
  ['solid'],
  [
    { name: 'solid-1', dependencies: { 'solid-js': '1.9.17' }, source: source('@oxform/solid') },
    {
      name: 'solid-2',
      dependencies: { 'solid-js': '2.0.0-rc.19', '@solidjs/web': '2.0.0-rc.19' },
      source: source('@oxform/solid/v2'),
    },
  ],
);
