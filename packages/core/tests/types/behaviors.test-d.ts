import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm, type Extension, type Slot } from '@oxform/core';
import { rootSlots, values } from '@oxform/core/behaviors';
import { describe, expectTypeOf, it } from 'vite-plus/test';

describe('values', () => {
  it('is an extension of a form', () => {
    expectTypeOf(
      values(defineForm({ schema: {} as StandardSchemaV1<object>, defaultValues: {} })),
    ).toEqualTypeOf<Extension>();
  });

  it('takes a form', () => {
    // @ts-expect-error values takes a form.
    values('form');
  });
});

describe('rootSlots', () => {
  it('is a slot group', () => {
    expectTypeOf(rootSlots).returns.toHaveProperty('root').toExtend<Slot<{}, {}, 'form'>>();
  });

  it('takes a slot factory', () => {
    // @ts-expect-error A slot group takes a slot factory.
    rootSlots({});
  });
});
