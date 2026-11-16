import { describe, expect, it } from 'vite-plus/test';
import { defineForm } from '#main/form';
import { reporting, schemaOf } from '../../tests/helpers';
import { arrays, arraysInternals } from './arrays';
import { check } from './check';
import { status, statusInternals } from './status';
import { validation, type CheckValidators } from './validation';
import { values } from './values';

type Profile = { tags: string[]; group: { members: string[] }; extra?: string[] };

const defaultValues: Profile = { tags: ['a', 'b', 'c'], group: { members: ['x'] } };

/** `values`, `status` and `arrays`, or with `validation` and an `error` check that takes `error` as validators. */
const setup = (error?: CheckValidators<Profile>) => {
  const base = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(values);
  const checked = base.extend(validation).extend(check('error')).extend(status).extend(arrays);
  const plain = base.extend(status).extend(arrays);
  const instance = error ? checked.create({ error }) : plain.create();
  const validated = instance as ReturnType<typeof checked.create>;

  return {
    form: plain,
    instance,
    arrays: instance.arrays,
    tags: () => instance.values.get('tags'),
    ids: (path = 'tags') => arraysInternals(instance.arrays).ids(path),
    dirty: (path: 'tags.0' | 'tags.1' | 'tags.2' | 'tags.3' | 'tags' | 'group') => instance.status.at(path).dirty,
    /** Marks an item dirty, as a field change does. */
    mark: (path: string) => statusInternals(instance.status).mark(path, { dirty: true }),
    validation: validated.validation,
    error: validated.error,
    [Symbol.dispose]: () => instance.destroy(),
  };
};

describe('arrays as an extension', () => {
  it('throws at create without values, and names arrays and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(arrays as never);

    expect(() => lacking.create()).toThrow('The "arrays" extension needs "values", which no earlier extension provides.');
  });

  it('throws at create without status, and names arrays and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues })
      .extend(values)
      .extend(arrays as never);

    expect(() => lacking.create()).toThrow('The "arrays" extension needs "status", which no earlier extension provides.');
  });

  it('changes the array without validation, also when should.validate asks for it', () => {
    using subject = setup();
    subject.arrays.append('tags', 'd', { should: { validate: true } });

    expect(subject.tags()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('append, prepend and insert', () => {
  it('append an item at the end', () => {
    using subject = setup();
    subject.arrays.append('tags', 'd');

    expect(subject.tags()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('prepend an item, and shift the item state', () => {
    using subject = setup();
    subject.mark('tags.0');
    subject.arrays.prepend('tags', 'y');

    expect([subject.tags(), subject.dirty('tags.0'), subject.dirty('tags.1')]).toEqual([['y', 'a', 'b', 'c'], false, true]);
  });

  it('insert at an index, with a negative index as 0', () => {
    using subject = setup();
    subject.arrays.insert('tags', 1, 'i');
    subject.arrays.insert('tags', -5, 'n');

    expect(subject.tags()).toEqual(['n', 'a', 'i', 'b', 'c']);
  });

  it('pad the array to an index after the end', () => {
    using subject = setup();
    subject.arrays.insert('tags', 5, 'e');

    expect(subject.tags()).toEqual(['a', 'b', 'c', undefined, undefined, 'e']);
  });

  it('start an absent array', () => {
    using subject = setup();
    subject.arrays.append('extra', 'first');

    expect(subject.instance.values.get('extra')).toEqual(['first']);
  });

  it('take an item, and store a function as the item', () => {
    type Handlers = { handlers: (() => string)[] };
    const handler = () => 'item';
    using _subject = setup();
    const form = defineForm({ schema: schemaOf<Handlers>(), defaultValues: { handlers: [] } })
      .extend(values)
      .extend(status)
      .extend(arrays);
    const instance = form.create();
    instance.arrays.append('handlers', handler);
    const [stored] = instance.values.get('handlers');
    instance.destroy();

    expect(stored).toBe(handler);
  });
});

describe('swap and move', () => {
  it('swap two items, and keep the order of the others', () => {
    using subject = setup();
    subject.arrays.swap('tags', 0, 2);

    expect(subject.tags()).toEqual(['c', 'b', 'a']);
  });

  it('do nothing to swap an item with itself or with an index after the end', () => {
    using subject = setup();
    subject.arrays.swap('tags', 1, 1);
    subject.arrays.swap('tags', 0, 9);

    expect([subject.tags(), subject.dirty('tags')]).toEqual([['a', 'b', 'c'], false]);
  });

  it('move an item, and keep the order of the others', () => {
    using subject = setup();
    subject.arrays.move('tags', 0, 2);

    expect(subject.tags()).toEqual(['b', 'c', 'a']);
  });

  it('do nothing to move an item to its own index or after the end', () => {
    using subject = setup();
    subject.arrays.move('tags', 1, 1);
    subject.arrays.move('tags', 9, 0);

    expect([subject.tags(), subject.dirty('tags')]).toEqual([['a', 'b', 'c'], false]);
  });

  it('move the item state with the items', () => {
    using subject = setup();
    subject.mark('tags.0');
    subject.arrays.move('tags', 0, 2);

    expect([subject.dirty('tags.0'), subject.dirty('tags.2')]).toEqual([false, true]);
  });
});

describe('update', () => {
  it('writes a value or the result of an updater', () => {
    using subject = setup();
    subject.arrays.update('tags', 0, 'z');
    subject.arrays.update('tags', 1, current => `${current}!`);

    expect(subject.tags()).toEqual(['z', 'b!', 'c']);
  });

  it('clamps the index', () => {
    using subject = setup();
    subject.arrays.update('tags', 9, 'last');
    subject.arrays.update('tags', -1, 'first');

    expect(subject.tags()).toEqual(['first', 'b', 'last']);
  });

  it('resets the state of the item and keeps the marks of the array', () => {
    using subject = setup();
    subject.mark('tags.1');
    subject.arrays.update('tags', 1, 'z');

    expect([subject.dirty('tags.1'), subject.dirty('tags')]).toEqual([false, true]);
  });

  it('writes index 0 of an empty array', () => {
    using subject = setup();
    subject.arrays.update('extra', 3, 'only');

    expect(subject.instance.values.get('extra')).toEqual(['only']);
  });
});

describe('remove', () => {
  it('removes the item at the clamped index', () => {
    using subject = setup();
    subject.arrays.remove('tags', 9);

    expect(subject.tags()).toEqual(['a', 'b']);
  });

  it('shifts the state of the later items', () => {
    using subject = setup();
    subject.mark('tags.2');
    subject.arrays.remove('tags', 0);

    expect([subject.dirty('tags.1'), subject.dirty('tags.2')]).toEqual([true, false]);
  });

  it('does nothing on an empty array', () => {
    using subject = setup();
    subject.arrays.remove('extra', 0);

    expect(subject.instance.values.get('extra')).toBeUndefined();
  });

  it('always skips validation', () => {
    using subject = setup({ change: reporting({ message: 'Bad', path: ['tags'] }) });
    subject.arrays.remove('tags', 0, { should: { validate: true } });

    expect(subject.validation.validating).toBe(false);
  });
});

describe('replace', () => {
  it('writes an array or the result of an updater', () => {
    using subject = setup();
    subject.arrays.replace('tags', ['q']);
    subject.arrays.replace('tags', current => [...current, 'r']);

    expect(subject.tags()).toEqual(['q', 'r']);
  });

  it('resets the state of every item, and drops the state of the trailing items', () => {
    using subject = setup();
    subject.mark('tags.2');
    subject.arrays.replace('tags', ['q']);

    expect([subject.dirty('tags.0'), subject.instance.store.state.status.fields['tags.2']]).toEqual([false, undefined]);
  });
});

describe('array marks and validation', () => {
  it('mark the array and its ancestors dirty and touched', () => {
    using subject = setup();
    subject.instance.arrays.append('group.members', 'y');

    expect([subject.instance.status.at('group.members'), subject.dirty('group')]).toEqual([
      expect.objectContaining({ dirty: true, touched: true }),
      true,
    ]);
  });

  it('request change validation of the array when a check has a change validator', async () => {
    using subject = setup({ change: reporting({ message: 'Too many', path: ['tags'] }) });
    const ran = new Promise(resolve => subject.validation.onRun(resolve));
    subject.arrays.append('tags', 'd');

    await expect(ran).resolves.toEqual(expect.objectContaining({ targets: ['tags'], type: 'change' }));
  });

  it('request no validation when no check has a change validator, or when should.validate is false', () => {
    using subject = setup({ blur: reporting() });
    subject.arrays.append('tags', 'd');
    subject.arrays.append('tags', 'e', { should: { validate: false } });

    expect(subject.validation.validating).toBe(false);
  });

  it('leave dirty off when should.dirty is false', () => {
    using subject = setup();
    subject.arrays.append('tags', 'd', { should: { dirty: false } });

    expect(subject.instance.status.at('tags')).toEqual(expect.objectContaining({ dirty: false, touched: true }));
  });

  it('leave touched off when should.touch is false', () => {
    using subject = setup();
    subject.arrays.append('tags', 'd', { should: { touch: false } });

    expect(subject.instance.status.at('tags')).toEqual(expect.objectContaining({ dirty: true, touched: false }));
  });
});

describe('check entries of array items', () => {
  /** Sets the entries `A`, `B` and `C` at the items of `tags`. */
  const seed = (subject: ReturnType<typeof setup>) => {
    for (const [index, message] of ['A', 'B', 'C'].entries()) subject.error.set(`tags.${index}` as never, [{ message }]);
  };
  /** The message at each index of `tags`. */
  const messages = (subject: ReturnType<typeof setup>) => [0, 1, 2, 3].map(index => subject.error.at(`tags.${index}` as never)[0]?.message);

  it('follow a swap, and keep the others', () => {
    using subject = setup({});
    seed(subject);
    subject.arrays.swap('tags', 0, 2);

    expect(messages(subject)).toEqual(['C', 'B', 'A', undefined]);
  });

  it('follow an insert, and keep the earlier items', () => {
    using subject = setup({});
    seed(subject);
    subject.arrays.insert('tags', 1, 'i');

    expect(messages(subject)).toEqual(['A', undefined, 'B', 'C']);
  });

  it('follow a remove, and drop the removed item', () => {
    using subject = setup({});
    seed(subject);
    subject.arrays.remove('tags', 1);

    expect(messages(subject)).toEqual(['A', 'C', undefined, undefined]);
  });
});

describe('a refused array write', () => {
  it('changes nothing', () => {
    using subject = setup();
    const before = subject.ids();
    subject.instance.values.intercept((_change, details) => details.cancel());
    subject.arrays.append('tags', 'd');

    expect([subject.ids(), subject.dirty('tags')]).toEqual([before, false]);
  });
});

describe('item ids', () => {
  it('stay the same between reads', () => {
    using subject = setup();

    expect(subject.ids()).toEqual(subject.ids());
  });

  it('follow the items through swap, move and remove', () => {
    using subject = setup();
    const [, b, c] = subject.ids();
    subject.arrays.swap('tags', 0, 2);
    subject.arrays.move('tags', 0, 1);
    subject.arrays.remove('tags', 2);

    expect(subject.ids()).toEqual([b, c]);
  });

  it('are new for new items', () => {
    using subject = setup();
    const before = subject.ids();
    subject.arrays.prepend('tags', 'p');
    subject.arrays.insert('tags', 2, 'i');
    const after = subject.ids();

    expect([after.length, new Set([...before, ...after]).size]).toEqual([5, 5]);
  });

  it('are all new after a replace', () => {
    using subject = setup();
    const before = subject.ids();
    subject.arrays.replace('tags', ['a', 'b', 'c']);

    expect(subject.ids().some(id => before.includes(id))).toBe(false);
  });

  it('follow a write of the array outside arrays', () => {
    using subject = setup();
    const before = subject.ids();
    subject.instance.values.set('tags', ['a']);

    expect(subject.ids()).toEqual(before.slice(0, 1));
  });
});
