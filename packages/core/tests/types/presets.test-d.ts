import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { values } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';
import { describe, expectTypeOf, it } from 'vite-plus/test';

describe('standard', () => {
  it('is a function from form to form', () => {
    const form = defineForm({ schema: {} as StandardSchemaV1<object>, defaultValues: {} });

    expectTypeOf(form.extend(standard)).toEqualTypeOf(form.extend(values));
  });

  it('takes a form', () => {
    // @ts-expect-error standard takes a form.
    standard('form');
  });
});
