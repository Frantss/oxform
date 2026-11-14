import { describe, expect, it, vi } from 'vitest';
import type { HandlesApi } from '../../api';
import { configureForm } from './form';
import { defineFragment } from './fragments';
import { standardForm } from './standard';
import { failing, schemaOf } from './test-helpers';

type Address = { street: string; zip: string };
type Checkout = { name: string };

const address = defineFragment({
  schema: schemaOf<Address>(),
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: failing({ message: 'Bad zip', path: ['zip'] }) } },
});

const checkout = configureForm(standardForm, {
  schema: schemaOf<Checkout>(),
  defaultValues: { name: '' },
  fragments: { billing: address, shipping: address },
});

describe('fragments', () => {
  it('mount their defaults at each prefix, so Values gains one entry per mount', () => {
    const form = checkout();

    expect(form.values.get()).toEqual({
      name: '',
      billing: { street: '', zip: '' },
      shipping: { street: '', zip: '' },
    });
    expect(form.values.get('billing.zip')).toBe('');
    // @ts-expect-error no such mount
    form.values.get('home.zip');
  });

  it('let an instance override a mount default', () => {
    const form = checkout({
      defaultValues: { name: '', billing: { street: 'Main', zip: '1' }, shipping: { street: '', zip: '' } },
    });

    expect(form.values.get('billing.street')).toBe('Main');
    expect(form.values.get('shipping.street')).toBe('');
  });

  it('run their validators at the mount and re-prefix the issue paths', async () => {
    const form = checkout();

    const [valid, issues] = await form.validation.run('billing', { type: 'change' });

    expect(valid).toBe(false);
    expect(issues.error.map(entry => entry.path)).toEqual([['billing', 'zip']]);
    expect(form.error.at('billing.zip')).toHaveLength(1);
    expect(form.error.at('shipping.zip')).toEqual([]);
  });

  it('are independent per mount: validating, changing and resetting one leaves the other', async () => {
    const form = checkout();

    form.events.change('billing.zip', '123');
    await form.validation.run('shipping', { type: 'change' });

    expect(form.status.at('billing.zip').dirty).toBe(true);
    expect(form.status.at('shipping.zip').dirty).toBe(false);
    expect(form.error.at('shipping.zip')).toHaveLength(1);

    form.reset.at('billing');
    expect(form.values.get('billing.zip')).toBe('');
    expect(form.error.at('shipping.zip')).toHaveLength(1);
  });

  it('hand a function validator the values at the fragment level', async () => {
    const seen = vi.fn();
    const checks = defineFragment({
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
    const form = configureForm(standardForm, {
      schema: schemaOf<Checkout>(),
      defaultValues: { name: 'Ada' },
      fragments: { billing: checks },
    })();

    await form.validation.run(undefined, { type: 'blur' });

    expect(seen).toHaveBeenCalledWith({ street: 'Main', zip: '' });
  });

  it('join the form’s own validators, per event', async () => {
    const form = configureForm(standardForm, {
      schema: schemaOf<Checkout>(),
      defaultValues: { name: '' },
      error: { change: failing({ message: 'Name required', path: ['name'] }) },
      fragments: { billing: address },
    })();

    const [, issues] = await form.validation.run(undefined, { type: 'change' });

    expect(issues.error.map(entry => entry.message).sort()).toEqual(['Bad zip', 'Name required']);
    expect(issues.error.find(entry => entry.message === 'Name required')?.path).toEqual(['name']);
  });

  it('give scoped handles typed to the fragment, so one function works at every mount', () => {
    const addressComplete = (scope: HandlesApi<Address, 'error'>) => scope.field('street').get() !== '' && scope.field('zip').get().length === 5;
    const form = checkout();

    form.scope('billing').field('street').change('Main');
    form.scope('billing').field('zip').change('12345');

    expect(addressComplete(form.scope('billing'))).toBe(true);
    expect(addressComplete(form.scope('shipping'))).toBe(false);
    expect(form.values.get('billing.zip')).toBe('12345');
    // @ts-expect-error `name` holds a string, not an object
    form.scope('name');
  });

  it('can be mounted in another form that uses the same fragment', () => {
    const other = configureForm(standardForm, {
      schema: schemaOf<{ title: string }>(),
      defaultValues: { title: '' },
      fragments: { home: address },
    })();

    expect(other.values.get('home')).toEqual({ street: '', zip: '' });
  });
});
