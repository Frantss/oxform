import {
  get,
  idPart,
  type ArrayItem,
  type ArrayPath,
  type ArrayValue,
  type DeepPartial,
  type MaybePromise,
  type ObjectPath,
  type Path,
  type PathValue,
  type Unsubscribe,
  type Updater,
} from '@oxform/core';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Profile = {
  name: string;
  age: number;
  born: Date;
  avatar?: File;
  address: { city: string; zip?: string };
  phone?: { number: string };
  tags: string[];
  links?: { url: string }[];
  pair: [number, string];
  contact: { kind: 'email'; email: string } | { kind: 'phone'; phone: string };
};

const profile = {} as Profile;

/** Accepts a value of the given type. A negative case calls it with a value of another type. */
const accepts = <Type>(value: Type): Type => value;

describe('get', () => {
  it('returns the value at the path', () => {
    expectTypeOf(get(profile, 'address.city')).toEqualTypeOf<string>();
  });

  it('rejects an unknown path', () => {
    // @ts-expect-error The path is not in the values.
    get(profile, 'address.country');
  });
});

describe('idPart', () => {
  it('returns a string', () => {
    expectTypeOf(idPart('address.city')).toEqualTypeOf<string>();
  });

  it('takes a path string', () => {
    // @ts-expect-error A path is a string.
    idPart(1);
  });
});

describe('Path', () => {
  it('holds nested keys, array indices, tuple indices and union members', () => {
    expectTypeOf<'address.zip' | 'tags.0' | 'links.1.url' | 'pair.1' | 'contact.email'>().toExtend<Path<Profile>>();
  });

  it('does not enter a date, a file or a string', () => {
    expectTypeOf<'born.getTime' | 'avatar.name' | 'name.length'>().not.toExtend<Path<Profile>>();
  });

  it('rejects an unknown path', () => {
    // @ts-expect-error The path is not in the values.
    accepts<Path<Profile>>('address.country');
  });

  it('accepts every path of unknown values', () => {
    expectTypeOf<Path<unknown>>().toEqualTypeOf<string>();
  });
});

describe('PathValue', () => {
  it('gives the value at a nested key', () => {
    expectTypeOf<PathValue<Profile, 'address.city'>>().toEqualTypeOf<string>();
  });

  it('adds undefined below an optional ancestor', () => {
    expectTypeOf<PathValue<Profile, 'phone.number'>>().toEqualTypeOf<string | undefined>();
  });

  it('adds undefined to an array item', () => {
    expectTypeOf<PathValue<Profile, 'links.0.url'>>().toEqualTypeOf<string | undefined>();
  });

  it('gives the exact type of a tuple item', () => {
    expectTypeOf<PathValue<Profile, 'pair.1'>>().toEqualTypeOf<string>();
  });

  it('gives never for an unknown path', () => {
    expectTypeOf<PathValue<Profile, 'address.country'>>().toBeNever();
  });

  it('rejects a value of the wrong type', () => {
    // @ts-expect-error The city is a string.
    accepts<PathValue<Profile, 'address.city'>>(1);
  });
});

describe('ObjectPath', () => {
  it('holds the paths of objects, arrays and dates', () => {
    expectTypeOf<'address' | 'phone' | 'tags' | 'born'>().toExtend<ObjectPath<Profile>>();
  });

  it('rejects a string path', () => {
    // @ts-expect-error The name is a string.
    accepts<ObjectPath<Profile>>('name');
  });
});

describe('ArrayPath', () => {
  it('holds the paths of arrays and optional arrays', () => {
    expectTypeOf<ArrayPath<Profile>>().toEqualTypeOf<'tags' | 'links' | 'pair'>();
  });

  it('rejects a path that is not an array', () => {
    // @ts-expect-error The address is an object.
    accepts<ArrayPath<Profile>>('address');
  });
});

describe('ArrayValue', () => {
  it('gives the array without undefined', () => {
    expectTypeOf<ArrayValue<Profile, 'links'>>().toEqualTypeOf<{ url: string }[]>();
  });

  it('rejects an item where the array is expected', () => {
    // @ts-expect-error A tag list is an array.
    accepts<ArrayValue<Profile, 'tags'>>('a');
  });
});

describe('ArrayItem', () => {
  it('gives the item type of the array', () => {
    expectTypeOf<ArrayItem<Profile, 'links'>>().toEqualTypeOf<{ url: string }>();
  });

  it('rejects an item of the wrong type', () => {
    // @ts-expect-error A tag is a string.
    accepts<ArrayItem<Profile, 'tags'>>(1);
  });
});

describe('Updater', () => {
  it('is a value or a function from the current value', () => {
    expectTypeOf<Updater<number>>().toEqualTypeOf<number | ((current: number) => number)>();
  });

  it('rejects a function that returns the wrong type', () => {
    // @ts-expect-error The function must return a number.
    accepts<Updater<number>>((current: number) => `${current}`);
  });
});

describe('DeepPartial', () => {
  it('makes nested keys optional and keeps dates and files whole', () => {
    expectTypeOf<{ address: { zip: '1000' }; born: Date }>().toExtend<DeepPartial<Profile>>();
  });

  it('rejects a value of the wrong type', () => {
    // @ts-expect-error The city is a string.
    accepts<DeepPartial<Profile>>({ address: { city: 1 } });
  });
});

describe('MaybePromise', () => {
  it('is a value or a promise of it', () => {
    expectTypeOf<MaybePromise<number>>().toEqualTypeOf<number | Promise<number>>();
  });
});

describe('Unsubscribe', () => {
  it('is a function with no parameter and no result', () => {
    expectTypeOf<Unsubscribe>().toEqualTypeOf<() => void>();
  });
});
