import { checkConsumers } from '../../../scripts/check-consumer.ts';

await checkConsumers(
  [],
  [
    {
      name: 'core',
      source: `
import { defineForm, type Form } from '@oxform/core';
import { slotsOf } from '@oxform/core/adapter';
import { values } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';

const form: Form = defineForm().extend(standard).extend(values);
if (slotsOf(form).join() !== 'values,values') throw new Error('The packed entry points do not share a module.');
// A type case only: it is never called.
export const rejected = () => {
  // @ts-expect-error A form is not a string.
  slotsOf('form');
};
`,
    },
  ],
);
