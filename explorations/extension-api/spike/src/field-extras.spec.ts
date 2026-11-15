import { describe, expect, it } from 'vitest';
import type { Extendable, FieldHandle, Form, Scope, Needs } from './api';
import { arrays } from './arrays';
import { events } from './events';
import { defineExtension, defineForm, on } from './form';
import { handles } from './handles';
import { reset } from './reset';
import { status } from './status';
import { schemaOf } from './test-helpers';
import { values } from './values';

/** The kernel extensions that `handles` needs, as a preset, so a spec extends the form with the real handles. */
const fieldHandles = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(form: Form<Values, Api, Options, State, Slots, Fields>) =>
  form.extend(values).extend(status).extend(events).extend(reset).extend(arrays).extend(handles);

const applyMask = (pattern: string, value: string) => {
  let index = 0;
  return pattern.replace(/#/g, () => value[index++] ?? '');
};
const isString = (value: unknown): value is string => typeof value === 'string';

// `mask` exists on string fields only: the type says so, and the guard does it at runtime.
const mask = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'mask',
    api: () => ({}),
    fields: on<string>(isString)(field => ({ mask: (pattern: string) => applyMask(pattern, field.get()) })),
  });

const upper = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'upper',
    api: () => ({}),
    fields: on()(field => ({ upper: () => String(field.get()).toUpperCase() })),
  });

type Profile = { name: string; tags: string[]; address: { city: string } };
const defaultProfile: Profile = { name: '', tags: ['a'], address: { city: '' } };

const profile = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile, id: 'profile' }).extend(fieldHandles);
const create = () => profile.extend(mask).create();

describe('field members', () => {
  it('adds the members to every field handle, reading the live value', () => {
    const form = create();

    form.field('name').change('5551234567');
    expect(form.field('name').mask('(###) ###-####')).toBe('(555) 123-4567');

    form.field('name').change('9998887777');
    expect(form.field('name').mask('###-###-####')).toBe('999-888-7777');
  });

  it('types the members by the field value: string fields only', () => {
    const form = create();

    expect(form.field('address.city').mask('#')).toBe('');
    // @ts-expect-error `tags` is not a string
    expect(form.field('tags').mask).toBeUndefined();
    // @ts-expect-error `address` is an object
    expect(form.field('address').mask).toBeUndefined();
  });

  it('keeps the base handle: its methods and its live state', () => {
    const form = create();
    const name = form.field('name');

    name.change('Ada');
    expect(name.get()).toBe('Ada');
    expect(name.state.value).toBe('Ada');

    name.change('Grace');
    expect(name.state.value).toBe('Grace');
  });

  it('combines the members of several extensions, in any order', () => {
    const form = profile.extend(mask).extend(upper).create();
    form.field('name').change('ada');

    expect(form.field('name').upper()).toBe('ADA');
    expect(form.field('name').mask('##')).toBe('ad');

    const reversed = profile.extend(upper).extend(mask).create();
    reversed.field('name').change('ada');
    expect(reversed.field('name').upper()).toBe('ADA');
    expect(reversed.field('name').mask('##')).toBe('ad');
  });

  it('refuses a member that redefines a member of the base handle', () => {
    const badMember = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
      defineExtension(form, { name: 'bad', api: () => ({}), fields: on()(() => ({ change: () => undefined })) });
    const form = profile.extend(badMember).create();

    expect(() => form.field('name')).toThrow(/The "bad" extension cannot redefine the field member "change"/);
  });
});

describe('field members on scoped handles', () => {
  type Billing = { street: string; unit: number; geo: { label: string; lat: number } };
  type Order = { name: string; billing: Billing };
  const order: Order = { name: '', billing: { street: '', unit: 1, geo: { label: '', lat: 0 } } };
  const orderForm = defineForm({ schema: schemaOf<Order>(), defaultValues: order, id: 'order' }).extend(fieldHandles);

  it('gives the members to the handles of a scope, typed by the sub-object', () => {
    const billing = orderForm.extend(mask).create().scope('billing');

    billing.field('street').change('5551234567');
    expect(billing.field('street').mask('(###) ###-####')).toBe('(555) 123-4567');
    // @ts-expect-error `unit` is a number
    expect(billing.field('unit').mask).toBeUndefined();
  });

  it('gives the members to a nested scope, typed by the sub-object at each level', () => {
    const form = orderForm.extend(mask).create();
    const geo = form.scope('billing').scope('geo');

    geo.field('label').change('abc');

    expect(geo.field('label').mask('##')).toBe('ab');
    expect(form.values.get('billing.geo.label')).toBe('abc');
    // @ts-expect-error `lat` is a number
    expect(geo.field('lat').mask).toBeUndefined();
  });

  it('gives the members three scopes deep, typed', () => {
    const deep = defineForm({
      schema: schemaOf<{ a: { b: { c: { s: string } } } }>(),
      defaultValues: { a: { b: { c: { s: 'xyz' } } } },
    })
      .extend(fieldHandles)
      .extend(mask)
      .create();
    const third = deep.scope('a').scope('b').scope('c');

    expect(third.field('s').mask('#')).toBe('x');
  });

  it('passes the path relative to the scope to the builder', () => {
    const paths: string[] = [];
    const pathRecorder = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
      defineExtension(form, { name: 'pathRecorder', api: () => ({}), fields: on()((_field, path) => (paths.push(path), {})) });
    const form = orderForm.extend(pathRecorder).create();

    form.field('billing.street');
    form.scope('billing').field('street');
    form.scope('billing').scope('geo').field('label');

    expect(paths).toEqual(['billing.street', 'street', 'label']);
  });

  it('keeps the base scoped members', () => {
    const billing = orderForm.extend(mask).create().scope('billing');
    const street = billing.field('street');

    street.change('x');

    expect(street.state.value).toBe('x');
    expect(billing.scope).toBeDefined();
  });

  it('are still assignable to a function written for Scope', () => {
    const streetOf = (scope: Scope<Billing, never>) => scope.field('street').get();
    const form = orderForm.extend(mask).create();
    form.field('billing.street').change('Main');

    expect(streetOf(form.scope('billing'))).toBe('Main');
    const handle: FieldHandle<Order, 'name'> = form.field('name') as never;
    void handle;
  });

  it('combines the members of several extensions in a scope', () => {
    const form = orderForm.extend(mask).extend(upper).create();
    const street = form.scope('billing').field('street');
    street.change('ab');

    expect(street.upper()).toBe('AB');
    expect(street.mask('#')).toBe('a');
  });
});

describe('field members need a field api', () => {
  const minimal = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile }).extend(values);

  it('is rejected by the types on a form without field(path)', () => {
    // @ts-expect-error `minimal` has no `field`
    minimal.extend(mask);
  });

  it('fails when an instance is created, if the types were bypassed', () => {
    const bypassed = minimal.extend(mask as never);

    expect(() => bypassed.create()).toThrow(/The "mask" extension adds field members, so the form needs a field\(path\) api/);
  });
});
