import { defineForm, type Form } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { describe, expectTypeOf, it } from 'vite-plus/test';

describe('standard', () => {
  it('is a function from form to form', () => {
    expectTypeOf(defineForm().extend(standard)).toEqualTypeOf<Form>();
  });

  it('takes a form', () => {
    // @ts-expect-error standard takes a form.
    standard('form');
  });
});
