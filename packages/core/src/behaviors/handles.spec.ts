import { describe, expect, it } from 'vite-plus/test';
import { defineExtension, defineForm, on, prefixOf } from '#main/form';
import type { Extendable } from '#main/types';
import { schemaOf } from '../../tests/helpers';
import { arrays } from './arrays';
import { check } from './check';
import { events } from './events';
import { handles } from './handles';
import { reset } from './reset';
import { status } from './status';
import { validation } from './validation';
import { values } from './values';

type Profile = { name: string; address: { city: string; tags: string[] }; items: { label: string }[] };

const defaultValues: Profile = { name: '', address: { city: 'Rome', tags: [] }, items: [{ label: 'a' }] };

/** An element whose focus and blur do nothing. */
const element = { focus: () => {}, blur: () => {} } as HTMLElement;

/** Field members that give each field the path it was built with. */
const pathed = <Values>(form: Extendable<Values>) =>
  defineExtension(form, { name: 'pathed', api: () => ({}), fields: on()((_field, path) => ({ where: () => path })) });

const root = () => defineForm({ schema: schemaOf<Profile>(), defaultValues });

/**
 * `values`, `status`, `events`, `arrays`, `reset` and `handles`, with `validation` and the checks `error` before
 * `handles` and `late` after it. `validated: false` drops `validation` and both checks.
 */
const setup = ({ validated = true }: { validated?: boolean } = {}) => {
  const plain = root().extend(values).extend(status).extend(events).extend(arrays).extend(reset).extend(handles);
  const full = root()
    .extend(values)
    .extend(validation)
    .extend(check('error'))
    .extend(status)
    .extend(events)
    .extend(arrays)
    .extend(reset)
    .extend(handles)
    .extend(check('late'))
    .extend(pathed);
  const instance = validated ? full.create({ id: 'profile' }) : plain.create();
  const checked = instance as ReturnType<typeof full.create>;

  return {
    form: plain,
    instance: checked,
    [Symbol.dispose]: () => instance.destroy(),
  };
};

describe('handles as an extension', () => {
  it.each(['values', 'status', 'events', 'reset', 'arrays'] as const)('throws at create without %s, and names handles and the need', need => {
    using _subject = setup();
    const earlier = { values: [], status: [values], events: [values, status], reset: [values, status, events] };
    const extensions = need === 'arrays' ? [values, status, events, reset] : earlier[need];
    const partial = extensions.reduce<{ extend(extension: unknown): never }>((form, extension) => form.extend(extension), root() as never);
    const lacking = (partial as { extend(extension: unknown): { create(): unknown } }).extend(handles);

    expect(() => lacking.create()).toThrow(`The "handles" extension needs "${need}", which no earlier extension provides.`);
  });

  it('gives a field no check sugar on a chain without validation', () => {
    using subject = setup({ validated: false });

    expect(Object.keys(subject.instance.field('name'))).toEqual(['state', 'get', 'change', 'focus', 'blur', 'register', 'unregister', 'reset']);
  });
});

describe('field handles', () => {
  it('read a live state: the id, the value, the default value, the element and the status', () => {
    using subject = setup();
    const city = subject.instance.field('address.city');
    city.register(element);
    city.change('Paris');

    expect(city.state).toEqual({
      id: 'profile-address-city',
      value: 'Paris',
      defaultValue: 'Rome',
      ref: element,
      status: expect.objectContaining({ dirty: true, touched: true }),
    });
  });

  it('bind focus, blur, unregister and reset to the path', () => {
    using subject = setup();
    const city = subject.instance.field('address.city');
    city.register(element);
    city.focus();
    city.blur();
    city.unregister();
    city.change('Paris');
    city.reset();

    expect([city.get(), city.state.ref, subject.instance.status.at('address.city').blurred]).toEqual(['Rome', null, false]);
  });

  it('mark the field blurred', () => {
    using subject = setup();
    subject.instance.field('name').blur();

    expect(subject.instance.status.at('name').blurred).toBe(true);
  });

  it('reset to a given value', () => {
    using subject = setup();
    subject.instance.field('name').reset({ value: 'given' });

    expect(subject.instance.values.get('name')).toBe('given');
  });

  it('carry the field members of the extensions, with the path relative to the scope', () => {
    using subject = setup();

    expect([subject.instance.field('address.city').where(), subject.instance.scope('address').field('city').where()]).toEqual([
      'address.city',
      'city',
    ]);
  });
});

describe('array handles', () => {
  it('run every operation on the path, and keep the ids with the items', () => {
    using subject = setup();
    const tags = subject.instance.array('address.tags');
    tags.append('b');
    tags.prepend('a');
    tags.insert(2, 'c');
    const [, second, third] = tags.ids;
    tags.swap(0, 2);
    tags.move(0, 1);
    tags.update(0, tag => tag.toUpperCase());
    tags.remove(2);

    expect([tags.get(), tags.ids]).toEqual([
      ['B', 'c'],
      [second, third],
    ]);
  });

  it('replace the items', () => {
    using subject = setup();
    subject.instance.array('items').replace(items => [...items, { label: 'b' }]);

    expect(subject.instance.values.get('items')).toEqual([{ label: 'a' }, { label: 'b' }]);
  });
});

describe('check sugar', () => {
  it('reads and sets the entries of each check applied before handles', () => {
    using subject = setup();
    const name = subject.instance.field('name');
    name.setError([{ message: 'Taken' }]);
    name.setError([{ message: 'Short' }], { mode: 'append' });

    expect([name.error().map(entry => entry.message), subject.instance.error.at('name').length]).toEqual([['Taken', 'Short'], 2]);
  });

  it('reads the nested entries of a field', () => {
    using subject = setup();
    subject.instance.error.set('address.city', [{ message: 'Unknown' }]);

    expect(subject.instance.field('address' as never).error({ nested: true })).toHaveLength(1);
  });

  it('gives no sugar for a check applied after handles', () => {
    using subject = setup();
    const name = subject.instance.field('name');

    expect(['late' in name, 'setLate' in name, 'error' in name]).toEqual([false, false, true]);
  });
});

describe('setError', () => {
  it('removes its entries when the field changes', () => {
    using subject = setup();
    const name = subject.instance.field('name');
    name.setError([{ message: 'Taken' }]);
    name.change('Ada');

    expect(name.error()).toEqual([]);
  });

  it('removes its entries when an ancestor changes', () => {
    using subject = setup();
    const city = subject.instance.field('address.city');
    city.setError([{ message: 'Unknown' }]);
    subject.instance.values.set('address', { city: 'Oslo', tags: [] });

    expect(city.error()).toEqual([]);
  });

  it('removes its entries at a reset', () => {
    using subject = setup();
    const name = subject.instance.field('name');
    name.setError([{ message: 'Taken' }]);
    subject.instance.reset.all();
    subject.instance.error.set('name', [{ message: 'Later' }]);
    name.change('Ada');

    expect(name.error().map(entry => entry.message)).toEqual(['Later']);
  });

  it('keeps its entries when another field changes', () => {
    using subject = setup();
    const name = subject.instance.field('name');
    name.setError([{ message: 'Taken' }]);
    subject.instance.field('address.city').change('Oslo');

    expect(name.error()).toHaveLength(1);
  });

  it('removes only the entries it set', () => {
    using subject = setup();
    const name = subject.instance.field('name');
    subject.instance.error.set('name', [{ message: 'Kept' }]);
    name.setError([{ message: 'Taken' }], { mode: 'append' });
    name.change('Ada', { should: { validate: false } });

    expect(name.error().map(entry => entry.message)).toEqual(['Kept']);
  });
});

describe('scopes', () => {
  it('resolve the paths of field and array at any depth', () => {
    using subject = setup();
    const address = subject.instance.scope('address');
    address.field('city').change('Oslo');
    address.array('tags').append('x');

    expect(subject.instance.values.get('address')).toEqual({ city: 'Oslo', tags: ['x'] });
  });

  it('resolve an array item path', () => {
    using subject = setup();
    subject.instance.scope('items.0').field('label').change('b');

    expect(subject.instance.values.get('items.0.label')).toBe('b');
  });

  it('are the same object for the same prefix (G9)', () => {
    using subject = setup();

    expect([
      subject.instance.scope('address') === subject.instance.scope('address'),
      subject.instance.scope('items').scope('0') === subject.instance.scope('items.0'),
    ]).toEqual([true, true]);
  });

  it('give their prefix to prefixOf, also after a spread', () => {
    using subject = setup();
    const item = subject.instance.scope('items').scope('0');

    expect([prefixOf(subject.instance), prefixOf({ ...item }), prefixOf({}), prefixOf(undefined)]).toEqual(['', 'items.0', '', '']);
  });
});
