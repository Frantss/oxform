import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm, type Slot } from '@oxform/core';
import {
  rootSlots,
  values,
  type Change,
  type ChangeApi,
  type ChangeDetails,
  type ChangeDetailsInput,
  type ChangeInterceptor,
  type ChangeListener,
  type ChangeReason,
  type ChangeSource,
  type ValuesApi,
} from '@oxform/core/behaviors';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Profile = { name: string; address: { city: string } };

const form = defineForm({
  schema: {} as StandardSchemaV1<Profile>,
  defaultValues: { name: '', address: { city: '' } },
});

/** Accepts a value of the given type. A negative case calls it with a value of another type. */
const accepts = <Type>(value: Type): Type => value;

describe('values', () => {
  it('adds the values api and the values state', () => {
    const instance = form.extend(values).create();

    expectTypeOf(instance.values).toEqualTypeOf<ValuesApi<Profile>>();
    expectTypeOf(instance.store.state.values).toEqualTypeOf<Profile>();
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

describe('ValuesApi', () => {
  const instance = form.extend(values).create();

  it('types a read and a write by path', () => {
    expectTypeOf(instance.values.get('address.city')).toEqualTypeOf<string>();
    expectTypeOf(instance.values.set('name', current => `${current}!`)).toEqualTypeOf<boolean>();
  });

  it('rejects a path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    instance.values.get('phone');
  });

  it('rejects a value of the wrong type', () => {
    // @ts-expect-error name is a string.
    instance.values.set('name', 1);
  });
});

describe('Change, ChangeInterceptor', () => {
  it('lets an interceptor return a replacement change or nothing', () => {
    expectTypeOf<ReturnType<ChangeInterceptor<Profile>>>().toEqualTypeOf<Change<Profile> | void>();
  });

  it('rejects a change at a path that the values do not have', () => {
    // @ts-expect-error Profile has no phone.
    accepts<Change<Profile>>({ path: 'phone', value: '' });
  });
});

describe('ChangeListener', () => {
  it('gets the change and the details', () => {
    expectTypeOf<Parameters<ChangeListener<Profile>>>().toEqualTypeOf<[Change<Profile>, ChangeDetails]>();
  });

  it('returns nothing', () => {
    // @ts-expect-error A listener takes a change.
    accepts<ChangeListener<Profile>>((change: number) => change);
  });
});

describe('ChangeApi', () => {
  it('runs a change with a write', () => {
    expectTypeOf<ChangeApi<Profile>['run']>().returns.toEqualTypeOf<boolean>();
  });

  it('rejects a write that does not report a change', () => {
    const change = {} as ChangeApi<Profile>;
    // @ts-expect-error The write returns whether it changed the values.
    change.run({ path: 'name', value: '' }, () => undefined);
  });
});

describe('ChangeDetails, ChangeDetailsInput, ChangeReason', () => {
  it('takes a reason as input and gives it with the cancel state', () => {
    expectTypeOf<ChangeDetailsInput['reason']>().toEqualTypeOf<ChangeReason | undefined>();
    expectTypeOf<ChangeDetails['canceled']>().toEqualTypeOf<boolean>();
  });

  it('takes no source or event since G15', () => {
    // @ts-expect-error The details input has a reason only.
    accepts<ChangeDetailsInput>({ reason: 'input', source: 'mouse' });
  });

  it('rejects a reason that is not a string', () => {
    // @ts-expect-error A reason is a string.
    accepts<ChangeReason>(1);
  });
});

describe('ChangeSource', () => {
  it('names the source of a change', () => {
    expectTypeOf<'keyboard'>().toExtend<ChangeSource>();
  });

  it('rejects a source that is not in the list', () => {
    // @ts-expect-error A source is one of the listed names.
    accepts<ChangeSource>('voice');
  });
});
