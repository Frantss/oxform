import { expect, it } from 'vitest';

import { setup } from './setup';

it('returns the default value of a field', () => {
    using context = setup();

    const value = context.field.get('name');

    expect(value).toBe('name');
  });

it('returns the default value of a nested field', () => {
    using context = setup();

    const value = context.field.get('nested.value');

    expect(value).toBe('value');
  });

it('returns the updated value after change', () => {
    using context = setup();

    context.field.change('name', 'updated');
    const value = context.field.get('name');

    expect(value).toBe('updated');
  });
