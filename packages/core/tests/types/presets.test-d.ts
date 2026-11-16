import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm, type InstanceOf, type PartsOf } from '@oxform/core';
import type { FieldHandle } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Login = { email: string };

const form = defineForm({ schema: {} as StandardSchemaV1<Login>, defaultValues: { email: '' } }).extend(standard);

describe('standard', () => {
  it('gives the field handles the sugar of the error check, and the parts of its slot groups', () => {
    expectTypeOf<ReturnType<InstanceOf<typeof form>['field']>>().toExtend<FieldHandle<Login, 'email', 'error'>>();
    expectTypeOf<keyof PartsOf<typeof form>>().toEqualTypeOf<'root' | 'field' | 'fieldError' | 'submit' | 'reset'>();
  });

  it('has only the error check', () => {
    // @ts-expect-error The standard chain has no `warning` check.
    form.create().field('email').warning();
  });

  it('takes a form', () => {
    // @ts-expect-error standard takes a form.
    standard('form');
  });
});
