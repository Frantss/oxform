import { expect, it } from 'vite-plus/test';
import type { Form } from '#core';
import { values } from '#core/behaviors';
import { standard } from '#core/presets';

/** A form that records each extension it is given. */
const setup = () => {
  const applied: unknown[] = [];
  const form: Form = {
    extend: extension => {
      applied.push(extension);

      return form;
    },
  };

  return { form, applied, [Symbol.dispose]() {} };
};

it('applies the values extension', () => {
  using recorder = setup();
  standard(recorder.form);

  expect(recorder.applied).toEqual([values]);
});
