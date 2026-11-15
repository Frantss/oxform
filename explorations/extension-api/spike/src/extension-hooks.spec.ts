import { describe, expect, it } from 'vitest';
import type { Extendable, Needs } from './api';
import { defineExtension, defineForm } from './form';
import { schemaOf } from './test-helpers';
import { values } from './values';

type Values = { email: string };

/**
 * An extension that reaches the form only through the kernel's hooks. The submit hooks (`submit.intercept`,
 * `submit.onResult`) and `validation.onRun` join this spec when those behaviors are ported.
 */
const hooked =
  (log: string[], name = 'hooked') =>
  <V extends Values>(form: Extendable<V, Needs<V, 'values'>>) =>
    defineExtension(form, {
      name,
      api: (_ctx, { values }) => {
        values.intercept((change, details) => {
          if (change.value === 'blocked') details.cancel();
          else if (typeof change.value === 'string') return { ...change, value: change.value.trim() };
        });
        values.onChange(change => void log.push(`${name}:change:${change.path}=${String(change.value)}`));
        return {};
      },
    });

const base = () => defineForm({ schema: schemaOf<Values>(), defaultValues: { email: '' } }).extend(values);

describe('extension hooks', () => {
  it('rewrites a value change through values.intercept', () => {
    const form = base().extend(hooked([])).create();

    form.values.set('email', '  a  ');

    expect(form.values.get('email')).toBe('a');
  });

  it('refuses a value change through details.cancel()', () => {
    const log: string[] = [];
    const form = base().extend(hooked(log)).create();

    expect(form.values.set('email', 'blocked')).toBe(false);
    expect(form.values.get('email')).toBe('');
    expect(log).toEqual([]);
  });

  it('observes the written change through values.onChange', () => {
    const log: string[] = [];

    base().extend(hooked(log)).create().values.set('email', 'a');

    expect(log).toEqual(['hooked:change:email=a']);
  });

  it('keeps the hooks of two instances apart', () => {
    const first: string[] = [];
    const second: string[] = [];
    const a = base().extend(hooked(first)).create();
    base().extend(hooked(second)).create();

    a.values.set('email', 'x');

    expect(first).toEqual(['hooked:change:email=x']);
    expect(second).toEqual([]);
  });

  it('runs the hooks of several extensions in the order they were applied', () => {
    const log: string[] = [];
    const form = base().extend(hooked(log, 'first')).extend(hooked(log, 'second')).create();

    form.values.set('email', 'a');

    expect(log).toEqual(['first:change:email=a', 'second:change:email=a']);
  });

  it('lets an earlier interceptor rewrite what a later one and the write see', () => {
    const seen: unknown[] = [];
    const upper = <V extends Values>(form: Extendable<V, Needs<V, 'values'>>) =>
      defineExtension(form, {
        name: 'upper',
        api: (_ctx, { values }) => {
          values.intercept(change => ({ ...change, value: String(change.value).toUpperCase() }));
          return {};
        },
      });
    const spy = <V extends Values>(form: Extendable<V, Needs<V, 'values'>>) =>
      defineExtension(form, {
        name: 'spy',
        api: (_ctx, { values }) => {
          values.intercept(change => void seen.push(change.value));
          return {};
        },
      });
    const form = base().extend(upper).extend(spy).create();

    form.values.set('email', 'a');

    expect(seen).toEqual(['A']);
    expect(form.values.get('email')).toBe('A');
  });
});
