import { checkConsumers } from '../../../scripts/check-consumer.ts';

await checkConsumers(
  ['react'],
  [
    {
      name: 'react',
      dependencies: { react: '19.3.1', '@types/react': '19.3.0' },
      source: `
import { defineForm } from '@oxform/core';
import { createParts } from '@oxform/react';

if (createParts(defineForm()).slots.length !== 0) throw new Error('A form with no extension has no slot.');
// A type case only: it is never called.
export const rejected = () => {
  // @ts-expect-error createParts takes a form.
  createParts('form');
};
`,
    },
  ],
);
