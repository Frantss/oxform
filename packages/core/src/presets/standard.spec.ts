import { expect, it } from 'vite-plus/test';
import type { Form } from '#core';
import { values } from '#core/behaviors';
import { standard } from '#core/presets';

it('applies the values extension', () => {
  const applied: unknown[] = [];
  const form: Form = {
    extend: extension => {
      applied.push(extension);
      return form;
    },
  };
  standard(form);

  expect(applied).toEqual([values]);
});
