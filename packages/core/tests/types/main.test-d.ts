import { defineExtension, defineForm, defineSlots, type Extension, type Form, type SlotDefinition } from '@oxform/core';
import { describe, expectTypeOf, it } from 'vite-plus/test';

describe('defineForm, Form', () => {
  it('makes a form that takes an extension', () => {
    expectTypeOf(defineForm()).toEqualTypeOf<Form>();
  });

  it('takes no argument', () => {
    // @ts-expect-error defineForm has no parameter yet.
    defineForm({});
  });
});

describe('defineExtension, Extension', () => {
  it('makes an extension with a name', () => {
    expectTypeOf(defineExtension(defineForm(), { name: 'x' })).toEqualTypeOf<Extension>();
  });

  it('needs a name', () => {
    // @ts-expect-error The definition has no name.
    defineExtension(defineForm(), {});
  });
});

describe('defineSlots, SlotDefinition', () => {
  it('makes a slot group with a name', () => {
    expectTypeOf(defineSlots({ name: 'x' }, () => ({}))).toEqualTypeOf<SlotDefinition>();
  });

  it('needs a build function', () => {
    // @ts-expect-error The build function is missing.
    defineSlots({ name: 'x' });
  });
});
