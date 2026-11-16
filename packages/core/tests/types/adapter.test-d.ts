import { defineForm, type FieldMembers, type KeyProp, type PartSpec, type Path, type Slot } from '@oxform/core';
import {
  adapterControlsOf,
  isDeepEqual,
  joinPath,
  prefixOf,
  slotsOf,
  type AdapterControls,
  type ChecksOfApi,
  type FieldMembersOf,
  type PartsFromSlots,
  type ResolveKeys,
} from '@oxform/core/adapter';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Login = { email: string; age: number };

const form = defineForm({ schema: {} as StandardSchemaV1<Login>, defaultValues: { email: '', age: 0 } });

/** Accepts a value of the given type. A negative case calls it with a value of another type. */
const accepts = <Type>(value: Type): Type => value;

describe('slotsOf', () => {
  it('reads the slots of a form', () => {
    expectTypeOf(slotsOf(form)).toEqualTypeOf<Readonly<Record<string, object>>>();
  });

  it('takes a form', () => {
    // @ts-expect-error slotsOf takes a form.
    slotsOf('form');
  });
});

describe('adapterControlsOf, AdapterControls', () => {
  it('gives the adapter controls of an instance', () => {
    expectTypeOf(adapterControlsOf(form.create())).toEqualTypeOf<AdapterControls>();
  });

  it('takes an instance', () => {
    // @ts-expect-error adapterControlsOf takes an instance.
    adapterControlsOf('instance');
  });

  it('takes the options as a record', () => {
    // @ts-expect-error The options are a record.
    adapterControlsOf(form.create()).setOptions('options');
  });
});

describe('joinPath', () => {
  it('returns a path', () => {
    expectTypeOf(joinPath('a', 'b')).toEqualTypeOf<string>();
  });

  it('takes two paths', () => {
    // @ts-expect-error joinPath takes a prefix and a path.
    joinPath('a');
  });
});

describe('isDeepEqual', () => {
  it('returns a boolean', () => {
    expectTypeOf(isDeepEqual({}, {})).toEqualTypeOf<boolean>();
  });

  it('takes two values', () => {
    // @ts-expect-error isDeepEqual compares two values.
    isDeepEqual({});
  });
});

describe('ResolveKeys', () => {
  it('replaces a key prop with a path of the values', () => {
    expectTypeOf<ResolveKeys<{ name: KeyProp; size: number }, Login>>().toEqualTypeOf<{
      readonly name: Path<Login>;
      readonly size: number;
    }>();
  });

  it('rejects a path that the values do not have', () => {
    // @ts-expect-error Login has no phone.
    accepts<ResolveKeys<{ name: KeyProp }, Login>>({ name: 'phone' });
  });
});

describe('PartsFromSlots', () => {
  type Slots = { readonly badge: Slot<{ readonly name: KeyProp }, { shown: boolean }, 'span'> };

  it('makes one part per slot', () => {
    expectTypeOf<PartsFromSlots<Slots>>().toEqualTypeOf<{
      readonly badge: PartSpec<{ readonly name: KeyProp }, { shown: boolean }, 'span'>;
    }>();
  });

  it('gives never for a value that is not a slot', () => {
    // @ts-expect-error A string is not a slot.
    accepts<PartsFromSlots<{ badge: string }>['badge']>({} as PartSpec);
  });
});

describe('ChecksOfApi', () => {
  it('gives never for an api without handles', () => {
    expectTypeOf<ChecksOfApi<{ values: object }>>().toBeNever();
  });

  it('rejects a check name of an api without handles', () => {
    // @ts-expect-error The api has no check.
    accepts<ChecksOfApi<{ values: object }>>('error');
  });
});

describe('FieldMembersOf', () => {
  type Fields = FieldMembers<string, { mask: () => string }>;

  it('gives the members of a field whose value fits', () => {
    expectTypeOf<FieldMembersOf<Fields, Login, 'email'>>().toEqualTypeOf<{ mask: () => string }>();
  });

  it('gives no member to a field whose value does not fit', () => {
    const members = {} as FieldMembersOf<Fields, Login, 'age'>;
    // @ts-expect-error `age` is a number.
    accepts(members.mask);
  });
});

describe('prefixOf', () => {
  it('reads the prefix of any object', () => {
    expectTypeOf(prefixOf(form)).toEqualTypeOf<string>();
  });

  it('rejects a value that is not an object', () => {
    // @ts-expect-error A prefix belongs to a scope object.
    prefixOf('items');
  });
});
