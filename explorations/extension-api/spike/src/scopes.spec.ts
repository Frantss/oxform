import { describe, expect, it, vi } from 'vitest';
import type { Scope } from './api';
import { defineForm } from './form';
import { defineScope } from './scopes';
import { standard } from './standard';
import { failing, schemaOf } from './test-helpers';

type Address = { street: string; zip: string };
type Checkout = { name: string };

const address = defineScope({
  schema: schemaOf<Address>(),
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: failing({ message: 'Bad zip', path: ['zip'] }) } },
});

const checkout = defineForm({
  schema: schemaOf<Checkout>(),
  defaultValues: { name: '' },
  scopes: { billing: address, shipping: address },
}).extend(standard);

describe('scopes', () => {
  it('place their defaults at each path, so Values gains one entry per scope', () => {
    const form = checkout.create();

    expect(form.values.get()).toEqual({
      name: '',
      billing: { street: '', zip: '' },
      shipping: { street: '', zip: '' },
    });
    expect(form.values.get('billing.zip')).toBe('');
    // @ts-expect-error no such scope
    form.values.get('home.zip');
  });

  it('let an instance override a scope default', () => {
    const form = checkout.create({
      defaultValues: { name: '', billing: { street: 'Main', zip: '1' }, shipping: { street: '', zip: '' } },
    });

    expect(form.values.get('billing.street')).toBe('Main');
    expect(form.values.get('shipping.street')).toBe('');
  });

  it('run their validators at the path and re-prefix the issue paths', async () => {
    const form = checkout.create();

    const [valid, issues] = await form.validation.run('billing', { type: 'change' });

    expect(valid).toBe(false);
    expect(issues.error.map(entry => entry.path)).toEqual([['billing', 'zip']]);
    expect(form.error.at('billing.zip')).toHaveLength(1);
    expect(form.error.at('shipping.zip')).toEqual([]);
  });

  it('are independent per path: validating, changing and resetting one leaves the other', async () => {
    const form = checkout.create();

    form.events.change('billing.zip', '123');
    await form.validation.run('shipping', { type: 'change' });

    expect(form.status.at('billing.zip').dirty).toBe(true);
    expect(form.status.at('shipping.zip').dirty).toBe(false);
    expect(form.error.at('shipping.zip')).toHaveLength(1);

    form.reset.at('billing');
    expect(form.values.get('billing.zip')).toBe('');
    expect(form.error.at('shipping.zip')).toHaveLength(1);
  });

  it('hand a function validator the values at the scope level', async () => {
    const seen = vi.fn();
    const checks = defineScope({
      schema: schemaOf<Address>(),
      defaultValues: { street: 'Main', zip: '' },
      checks: {
        error: {
          blur: store => {
            seen(store.values);
            return failing();
          },
        },
      },
    });
    const form = defineForm({ schema: schemaOf<Checkout>(), defaultValues: { name: 'Ada' }, scopes: { billing: checks } })
      .extend(standard)
      .create();

    await form.validation.run(undefined, { type: 'blur' });

    expect(seen).toHaveBeenCalledWith({ street: 'Main', zip: '' });
  });

  it('can be placed in another form that uses the same scope definition', () => {
    const other = defineForm({
      schema: schemaOf<{ title: string }>(),
      defaultValues: { title: '' },
      scopes: { home: address },
    })
      .extend(standard)
      .create();

    expect(other.values.get('home')).toEqual({ street: '', zip: '' });
  });
});

describe('the scope view', () => {
  const isComplete = (scope: Scope<Address, 'error'>) => scope.field('street').get() !== '' && scope.field('zip').get().length === 5;

  it('is the same type at a placed scope, at a plain object path, and in another form', () => {
    const form = checkout.create();
    const plain = defineForm({
      schema: schemaOf<{ delivery: Address }>(),
      defaultValues: { delivery: { street: 'Main', zip: '12345' } },
    })
      .extend(standard)
      .create();
    const other = defineForm({ schema: schemaOf<{ title: string }>(), defaultValues: { title: '' }, scopes: { home: address } })
      .extend(standard)
      .create();

    form.scope('billing').field('street').change('Main');
    form.scope('billing').field('zip').change('12345');

    expect(isComplete(form.scope('billing'))).toBe(true);
    expect(isComplete(form.scope('shipping'))).toBe(false);
    expect(isComplete(plain.scope('delivery'))).toBe(true);
    expect(isComplete(other.scope('home'))).toBe(false);
    expect(form.values.get('billing.zip')).toBe('12345');
    // @ts-expect-error `name` holds a string, not an object
    form.scope('name');
  });

  it('is reached only through form.scope(path): a scope adds no member to the instance', () => {
    const form = checkout.create();

    expect((form as Record<string, unknown>).billing).toBeUndefined();
    expect(Object.keys(form)).not.toContain('billing');
  });

  it('works for an array item path', () => {
    const form = defineForm({
      schema: schemaOf<{ members: { name: string }[] }>(),
      defaultValues: { members: [{ name: 'Ada' }, { name: 'Grace' }] },
    })
      .extend(standard)
      .create();

    expect(form.scope('members.1').field('name').get()).toBe('Grace');
    form.scope('members.0').field('name').change('Alan');
    expect(form.values.get('members.0.name')).toBe('Alan');
  });
});

describe('scope conflicts', () => {
  it('rule 1: a scope key that is a key of the form’s own values throws at create, naming the scope', () => {
    const clashing = defineForm({
      schema: schemaOf<{ billing: string }>(),
      defaultValues: { billing: 'x' },
      scopes: { billing: address } as never,
    }).extend(standard);

    expect(() => clashing.create()).toThrow(/scope "billing".*own values/);
  });

  it('rule 2: defaults deep-merge, instance over configure over the scope over the form', () => {
    const configured = checkout.configure({
      defaultValues: { name: '', billing: { street: 'Configured', zip: '11111' }, shipping: { street: '', zip: '' } },
    });

    const partial = { name: '', billing: { street: 'Own' } };
    const form = configured.create({ defaultValues: partial as never });

    // street from the instance, zip from `configure`, and the rest of the form from the scope definition
    expect(form.values.get('billing')).toEqual({ street: 'Own', zip: '11111' });
    expect(form.values.get('shipping')).toEqual({ street: '', zip: '' });
  });

  it('rule 2: a partial instance default keeps the scope default for the keys it leaves out', () => {
    const withDefaults = defineScope({ schema: schemaOf<Address>(), defaultValues: { street: 'Main', zip: '00000' } });
    const form = defineForm({ schema: schemaOf<Checkout>(), defaultValues: { name: '' }, scopes: { billing: withDefaults } })
      .extend(standard)
      .create({ defaultValues: { name: '', billing: { street: 'Own' } } as never });

    expect(form.values.get('billing')).toEqual({ street: 'Own', zip: '00000' });
  });

  it('rule 2: arrays replace and are not merged by index', () => {
    const tagged = defineScope({ schema: schemaOf<{ tags: string[] }>(), defaultValues: { tags: ['a', 'b', 'c'] } });
    const form = defineForm({ schema: schemaOf<Checkout>(), defaultValues: { name: '' }, scopes: { box: tagged } })
      .extend(standard)
      .create({ defaultValues: { name: '', box: { tags: ['z'] } } });

    expect(form.values.get('box.tags')).toEqual(['z']);
  });

  it('rule 3: the form’s validator and the scope’s both run, and both report on the same field', async () => {
    const form = checkout.create({ error: { change: failing({ message: 'Own zip', path: ['billing', 'zip'] }) } });

    const [, issues] = await form.validation.run(undefined, { type: 'change' });

    expect(
      issues.error
        .filter(entry => entry.path?.join('.') === 'billing.zip')
        .map(entry => entry.message)
        .sort(),
    ).toEqual(['Bad zip', 'Own zip']);
  });

  it('rule 3: they join the form’s own validators, per event', async () => {
    const form = checkout.create({ error: { change: failing({ message: 'Name required', path: ['name'] }) } });

    const [, issues] = await form.validation.run(undefined, { type: 'change' });

    expect(issues.error.map(entry => entry.message).sort()).toEqual(['Bad zip', 'Bad zip', 'Name required']);
    expect(issues.error.find(entry => entry.message === 'Name required')?.path).toEqual(['name']);
  });

  it('rule 4: a check the form does not have throws at create, naming the scope and the check', () => {
    const warned = defineScope({
      schema: schemaOf<Address>(),
      defaultValues: { street: '', zip: '' },
      checks: { warning: { change: failing({ message: 'Odd zip', path: ['zip'] }) } },
    });
    const form = defineForm({ schema: schemaOf<Checkout>(), defaultValues: { name: '' }, scopes: { billing: warned } }).extend(standard);

    expect(() => form.create()).toThrow(/scope "billing".*check "warning"/);
  });

  it('rule 4: a form with no validation at all has no check for a scope to use', () => {
    const form = defineForm({ schema: schemaOf<Checkout>(), defaultValues: { name: '' }, scopes: { billing: address } });

    expect(() => form.create()).toThrow(/scope "billing".*check "error"/);
  });

  it('rule 5: a dotted key throws at create, since a scope is one key and a nested path is form.scope(path)', () => {
    const dotted = defineForm({
      schema: schemaOf<Checkout>(),
      defaultValues: { name: '' },
      scopes: { 'a.b': address } as never,
    }).extend(standard);

    expect(() => dotted.create()).toThrow(/scope "a\.b".*dot/);
  });

  it('rule 6: the form-level schema only types the values: nothing validates with it', async () => {
    const rejecting = failing({ message: 'Never read', path: ['name'] });
    const form = defineForm({ schema: rejecting as never, defaultValues: { name: '' } })
      .extend(standard)
      .create();

    const [valid] = await form.validation.run(undefined, { type: 'change' });

    expect(valid).toBe(true);
  });
});
