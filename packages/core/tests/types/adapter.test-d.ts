import { defineForm } from '@oxform/core';
import { joinPath, slotsOf } from '@oxform/core/adapter';
import { describe, expectTypeOf, it } from 'vite-plus/test';

describe('slotsOf', () => {
  it('reads the chain of a form', () => {
    expectTypeOf(slotsOf(defineForm())).toEqualTypeOf<readonly string[]>();
  });

  it('takes a form', () => {
    // @ts-expect-error slotsOf takes a form.
    slotsOf('form');
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
