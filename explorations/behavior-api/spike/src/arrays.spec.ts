import { describe, expect, it } from 'vitest';
import { arraysInternals } from './arrays';
import { configureForm } from './form';
import { standardForm } from './standard';
import { createProfileForm, failing, schemaOf } from './test-helpers';

type ProfileForm = ReturnType<typeof createProfileForm>;
const tagsOf = (form: ProfileForm) => form.values.get('tags');
const idsOf = (form: ProfileForm) => arraysInternals(form.arrays).ids('tags');

describe('array operations', () => {
  it('appends, prepends and inserts, with negative indices becoming zero and padding past the end', () => {
    const form = createProfileForm();

    form.arrays.append('tags', 'd');
    form.arrays.prepend('tags', 'z');
    form.arrays.insert('tags', 1, 'y');
    form.arrays.insert('tags', -3, 'first');
    expect(tagsOf(form)).toEqual(['first', 'z', 'y', 'a', 'b', 'c', 'd']);

    form.arrays.insert('tags', 9, 'late');
    expect(tagsOf(form)).toHaveLength(10);
    expect(tagsOf(form)[8]).toBeUndefined();
    expect(tagsOf(form)[9]).toBe('late');
  });

  it('starts an absent array empty', () => {
    type Optional = { tags?: string[] };
    const form = configureForm(standardForm, { schema: schemaOf<Optional>(), defaultValues: {} })();

    form.arrays.append('tags', 'a');

    expect(form.values.get('tags')).toEqual(['a']);
  });

  it('swaps, treating the same index as a no-op, and moves while keeping the others in order', () => {
    const form = createProfileForm();

    form.arrays.swap('tags', 1, 1);
    expect(tagsOf(form)).toEqual(['a', 'b', 'c']);
    expect(form.status.at('tags' as never).dirty).toBe(false);

    form.arrays.swap('tags', 0, 2);
    expect(tagsOf(form)).toEqual(['c', 'b', 'a']);

    form.arrays.move('tags', 0, 2);
    expect(tagsOf(form)).toEqual(['b', 'a', 'c']);
  });

  it('still applies change behavior when a move keeps the same index', () => {
    const form = createProfileForm();

    form.arrays.move('tags', 1, 1);

    expect(tagsOf(form)).toEqual(['a', 'b', 'c']);
    expect(form.status.at('tags' as never).dirty).toBe(true);
  });

  it('updates with a value or an updater, clamps the index, and resets the item state', () => {
    const form = createProfileForm();
    form.events.change('tags.1', 'x');
    expect(form.status.at('tags.1').dirty).toBe(true);

    form.arrays.update('tags', 1, current => `${current}!`);
    expect(tagsOf(form)).toEqual(['a', 'x!', 'c']);
    expect(form.status.at('tags.1').dirty).toBe(false);

    form.arrays.update('tags', 99, 'last');
    form.arrays.update('tags', -4, 'first');
    expect(tagsOf(form)).toEqual(['first', 'x!', 'last']);
  });

  it('removes with a clamped index, shifts field state, and always skips validation', async () => {
    const form = createProfileForm({ error: { change: failing({ message: 'Bad', path: ['tags'] }) } });
    form.events.change('tags.2', 'z', { should: { validate: false } });

    form.arrays.remove('tags', 0, { should: { validate: true } });
    await new Promise(resolve => setTimeout(resolve));

    expect(tagsOf(form)).toEqual(['b', 'z']);
    expect(form.status.at('tags.1').dirty).toBe(true);
    expect(form.status.at('tags.2').dirty).toBe(false);
    expect(form.error.at('tags')).toEqual([]);

    form.arrays.remove('tags', 50);
    expect(tagsOf(form)).toEqual(['b']);
  });

  it('replaces with an array or an updater, and resets the array and descendant state', () => {
    const form = createProfileForm();
    form.events.change('tags.0', 'x');

    form.arrays.replace('tags', current => current.filter(tag => tag !== 'b'));

    expect(tagsOf(form)).toEqual(['x', 'c']);
    expect(form.status.at('tags.0').dirty).toBe(false);
    expect(form.status.at('tags' as never).dirty).toBe(true);
  });

  it('requests change validation for the array when a validator exists', async () => {
    const form = createProfileForm({ error: { change: failing({ message: 'Too many', path: ['tags'] }) } });

    form.arrays.append('tags', 'd');
    await new Promise(resolve => setTimeout(resolve));

    expect(form.error.at('tags')).toHaveLength(1);
  });
});

describe('item ids', () => {
  it('stay stable across reads and follow items through swap, move and remove', () => {
    const form = createProfileForm();
    const [a, b, c] = idsOf(form);
    expect(idsOf(form)).toEqual([a, b, c]);

    form.arrays.swap('tags', 0, 2);
    expect(idsOf(form)).toEqual([c, b, a]);

    form.arrays.move('tags', 0, 2);
    expect(idsOf(form)).toEqual([b, a, c]);

    form.arrays.remove('tags', 0);
    expect(idsOf(form)).toEqual([a, c]);
  });

  it('give new items new ids, and replace gives every item a new id', () => {
    const form = createProfileForm();
    const before = idsOf(form);

    form.arrays.prepend('tags', 'z');
    const after = idsOf(form);
    expect(after.slice(1)).toEqual(before);
    expect(new Set(after).size).toBe(4);

    form.arrays.replace('tags', ['p', 'q']);
    expect(idsOf(form).some(id => after.includes(id))).toBe(false);
  });
});

describe('issues follow array items', () => {
  const withIssues = () => {
    const form = createProfileForm();
    form.error.set('tags', [{ message: 'Array level' }]);
    form.error.set('tags.0', [{ message: 'on a' }]);
    form.error.set('tags.2', [{ message: 'on c' }]);
    return form;
  };
  const messages = (form: ProfileForm, path: 'tags.0' | 'tags.1' | 'tags.2' | 'tags.3') => form.error.at(path).map(entry => entry.message);

  it('move with swap, and leave the array-level issue in place', () => {
    const form = withIssues();

    form.arrays.swap('tags', 0, 2);

    expect(messages(form, 'tags.0')).toEqual(['on c']);
    expect(messages(form, 'tags.2')).toEqual(['on a']);
    expect(form.error.at('tags')).toEqual([{ message: 'Array level' }]);
  });

  it('shift with prepend and insert', () => {
    const form = withIssues();

    form.arrays.prepend('tags', 'z');
    expect(messages(form, 'tags.1')).toEqual(['on a']);
    expect(messages(form, 'tags.3')).toEqual(['on c']);

    form.arrays.insert('tags', 2, 'y');
    expect(messages(form, 'tags.1')).toEqual(['on a']);
    expect(messages(form, 'tags.3')).toEqual([]);
  });

  it('follow a move, and are dropped with a removed item while later items shift', () => {
    const form = withIssues();

    form.arrays.move('tags', 0, 2);
    expect(messages(form, 'tags.0')).toEqual([]);
    expect(messages(form, 'tags.1')).toEqual(['on c']);
    expect(messages(form, 'tags.2')).toEqual(['on a']);

    form.arrays.remove('tags', 1);
    expect(messages(form, 'tags.1')).toEqual(['on a']);
    expect(messages(form, 'tags.2')).toEqual([]);
  });
});
