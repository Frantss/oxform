import { describe, expect, it } from 'vitest';
import type { FormKind, HandlesApi, Path, PathValue, PlainKind, ValuesApi } from '../../api';
import { createChange } from './change';
import { configureForm, defineExtension, defineForm } from './form';
import { standardForm } from './standard';
import { defaultProfile, schemaOf, type Profile } from './test-helpers';
import { createValues } from './values';

// Sketch 06: `mask` exists on string fields only. The kind types it, and `fieldExtras` implements it.
type MaskExtras<Values, P> = P extends Path<Values> ? (PathValue<Values, P> extends string ? { mask(pattern: string): string } : {}) : {};
interface MaskKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: {};
  readonly parts: {};
  readonly fieldExtras: MaskExtras<this['values'], this['path']>;
}
type NeedsField = { field: (path: any) => { get(): unknown } };

const applyMask = (pattern: string, value: string) => {
  let index = 0;
  return pattern.replace(/#/g, () => value[index++] ?? '');
};

const withMask = defineExtension<NeedsField, MaskKind>({
  name: 'mask',
  api: () => ({}),
  // The kind narrows `mask` to string fields in the types. At runtime the extension decides, so it mirrors that.
  fieldExtras: (_path, field) => (typeof field.get() === 'string' ? { mask: pattern => applyMask(pattern, String(field.get())) } : {}),
});

interface UpperKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: {};
  readonly parts: {};
  readonly fieldExtras: { upper(): string };
}
const withUpper = defineExtension<NeedsField, UpperKind>({
  name: 'upper',
  api: () => ({}),
  fieldExtras: (_path, field) => ({ upper: () => String(field.get()).toUpperCase() }),
});

const create = () => configureForm(withMask(standardForm), { schema: schemaOf<Profile>(), defaultValues: defaultProfile, id: 'profile' })();

describe('fieldExtras', () => {
  it('adds the extras to every field handle, reading the live value', () => {
    const form = create();

    form.field('name').change('5551234567');
    expect(form.field('name').mask('(###) ###-####')).toBe('(555) 123-4567');

    form.field('name').change('9998887777');
    expect(form.field('name').mask('###-###-####')).toBe('999-888-7777');
  });

  it('types the extras by the field value: string fields only', () => {
    const form = create();

    expect(form.field('address.city').mask('#')).toBe('');
    // @ts-expect-error `tags` is not a string
    expect(form.field('tags').mask).toBeUndefined();
    // @ts-expect-error `address` is an object
    expect(form.field('address').mask).toBeUndefined();
  });

  it('keeps the base handle: its methods, its check sugar and its live state', () => {
    const form = create();
    const name = form.field('name');

    name.change('Ada');
    name.setError([{ message: 'Taken' }]);

    expect(name.get()).toBe('Ada');
    expect(name.state.value).toBe('Ada');
    expect(name.state.status.dirty).toBe(true);
    expect(name.error()).toEqual([{ message: 'Taken' }]);

    name.change('Grace');
    expect(name.state.value).toBe('Grace');
  });

  it('combines the extras of several extensions, in any order', () => {
    const form = configureForm(withUpper(withMask(standardForm)), {
      schema: schemaOf<Profile>(),
      defaultValues: defaultProfile,
    })();
    form.field('name').change('ada');

    expect(form.field('name').upper()).toBe('ADA');
    expect(form.field('name').mask('##')).toBe('ad');
  });

  it('refuses an extra that redefines a member of the base handle', () => {
    const withBadExtra = defineExtension<NeedsField, PlainKind<{}>>({
      name: 'bad',
      api: () => ({}),
      fieldExtras: () => ({ change: () => undefined }),
    });
    const form = configureForm(withBadExtra(standardForm), {
      schema: schemaOf<Profile>(),
      defaultValues: defaultProfile,
    })();

    expect(() => form.field('name')).toThrow(/cannot redefine the field member "change"/);
  });
});

describe('fieldExtras on scoped handles', () => {
  type Billing = { street: string; unit: number; geo: { label: string; lat: number } };
  type Order = { name: string; billing: Billing };
  const order: Order = { name: '', billing: { street: '', unit: 1, geo: { label: '', lat: 0 } } };

  const createOrder = (extension = withMask) =>
    configureForm(extension(standardForm), { schema: schemaOf<Order>(), defaultValues: order, id: 'order' })();

  it('give the extras to the handles of a scope, typed by the sub-object', () => {
    const billing = createOrder().scope('billing');

    billing.field('street').change('5551234567');
    expect(billing.field('street').mask('(###) ###-####')).toBe('(555) 123-4567');
    // @ts-expect-error `unit` is a number
    expect(billing.field('unit').mask).toBeUndefined();
  });

  it('give the extras to a nested scope, typed by the sub-object at each level', () => {
    const form = createOrder();
    const geo = form.scope('billing').scope('geo');

    geo.field('label').change('abc');

    expect(geo.field('label').mask('##')).toBe('ab');
    expect(form.values.get('billing.geo.label')).toBe('abc');
    // @ts-expect-error `lat` is a number
    expect(geo.field('lat').mask).toBeUndefined();
  });

  it('give the extras three scopes deep, typed', () => {
    const deep = configureForm(withMask(standardForm), {
      schema: schemaOf<{ a: { b: { c: { s: string } } } }>(),
      defaultValues: { a: { b: { c: { s: 'xyz' } } } },
    })();
    const third = deep.scope('a').scope('b').scope('c');

    expect(third.field('s').mask('#')).toBe('x');
  });

  it('pass the path relative to the scope to fieldExtras', () => {
    const paths: string[] = [];
    const withPaths = defineExtension<NeedsField, PlainKind<{}>>({
      name: 'paths',
      api: () => ({}),
      fieldExtras: path => (paths.push(path), {}),
    });
    const form = createOrder(withPaths as never);

    form.field('billing.street');
    form.scope('billing').field('street');
    form.scope('billing').scope('geo').field('label');

    expect(paths).toEqual(['billing.street', 'street', 'label']);
  });

  it('keep the base scoped members and the check sugar', () => {
    const billing = createOrder().scope('billing');
    const street = billing.field('street');

    street.change('x');
    street.setError([{ message: 'Bad' }]);

    expect(street.state.value).toBe('x');
    expect(street.error()).toEqual([{ message: 'Bad' }]);
    expect(billing.array).toBeDefined();
  });

  it('are still assignable to a function written for HandlesApi', () => {
    const streetOf = (scope: HandlesApi<Billing, 'error'>) => scope.field('street').get();
    const form = createOrder();
    form.field('billing.street').change('Main');

    expect(streetOf(form.scope('billing'))).toBe('Main');
  });

  it('combine the extras of several extensions in a scope', () => {
    const form = configureForm(withUpper(withMask(standardForm)), {
      schema: schemaOf<Order>(),
      defaultValues: order,
    })();
    const street = form.scope('billing').field('street');
    street.change('ab');

    expect(street.upper()).toBe('AB');
    expect(street.mask('#')).toBe('a');
  });
});

describe('fieldExtras needs a field api', () => {
  type MinimalKind = FormKind & {
    readonly options: { readonly schema: unknown; readonly defaultValues: unknown };
    readonly state: {};
    readonly api: { readonly values: ValuesApi<Profile> };
    readonly parts: {};
  };
  const minimal = defineForm<MinimalKind>({
    name: 'minimal',
    options: { schema: 'value', defaultValues: 'value' },
    api: ctx => ({ values: createValues(ctx as never, { change: createChange(ctx) }) }),
  });

  it('is rejected by the types on a form without field(path)', () => {
    // @ts-expect-error `minimal` has no `field`
    withMask(minimal);
  });

  it('fails when an instance is created, if the types were bypassed', () => {
    const bypassed = withMask(minimal as never) as unknown as typeof standardForm;

    expect(() => configureForm(bypassed, { schema: schemaOf<Profile>(), defaultValues: defaultProfile })()).toThrow(/mask.*field\(path\) api/);
  });
});
