import { describe, expect, it, vi } from 'vite-plus/test';
import { defineExtension, defineForm, on, optionTypes, type Extendable, type Needs } from '#core';
import { slotsOf } from '#core/adapter';
import { standard } from '#core/presets';
import { schemaOf } from './helpers';

type Profile = { name: string; age: number };

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * A test-local extension with every part: the `limit` option, the `edits` state, an api, the `edits` slot,
 * the `trimmed` member on string fields, and a submit hook that writes `name` to `log`.
 */
const tracked =
  (name: string, log: string[], cleanup = () => {}) =>
  <Values>(form: Extendable<Values, Needs<Values, 'values' | 'submit'>>) =>
    defineExtension(form, {
      name,
      needs: { api: ['values', 'submit'] },
      options: optionTypes<{ limit: number }>(),
      state: () => ({ edits: 0 }),
      api: (context, deps) => {
        const stop = deps.values.onChange(() => context.state.edits.set(edits => edits + 1));
        deps.submit.intercept(() => void log.push(name));
        context.onDestroy(() => {
          stop();
          cleanup();
        });
        return { tracker: { overLimit: () => context.state.edits.get() > (context.options().limit ?? Infinity) } };
      },
      slots: slot => ({ edits: slot({ element: 'output', state: state => ({ edits: state.edits }), text: ({ edits }) => String(edits) }) }),
      fields: on(isString)(field => ({ trimmed: () => field.get().trim() })),
    });

/** A second extension with a submit hook only, to check the order of the hooks. */
const hooked =
  (name: string, log: string[]) =>
  <Values>(form: Extendable<Values, Needs<Values, 'submit'>>) =>
    defineExtension(form, {
      name,
      needs: { api: ['submit'] },
      api: (_context, deps) => {
        deps.submit.intercept(() => void log.push(name));
        return {};
      },
    });

const base = () => defineForm({ schema: schemaOf<Profile>(), defaultValues: { name: '', age: 0 } }).extend(standard);

/** A standard form with `tracked` after it, configured with a limit of one edit. */
const setup = () => {
  const log: string[] = [];
  const cleanup = vi.fn();
  const form = base()
    .extend(tracked('tracked', log, cleanup))
    .configure({ limit: 1 });
  const instance = form.create();

  return { form, instance, log, cleanup, [Symbol.dispose]: () => instance.destroy() };
};

describe('a custom extension on a standard form', () => {
  it('reads its option and its state through its api', () => {
    using subject = setup();
    subject.instance.field('name').change('Ada');
    const underLimit = subject.instance.tracker.overLimit();
    subject.instance.field('name').change('Grace');

    expect([underLimit, subject.instance.tracker.overLimit(), subject.instance.store.state.edits]).toEqual([false, true, 2]);
  });

  it('adds a slot that reads its state', () => {
    using subject = setup();
    subject.instance.field('name').change('Ada');
    const slot = slotsOf(subject.form).edits as unknown as { state(state: unknown): { edits: number }; text(state: { edits: number }): string };

    expect(slot.text(slot.state(subject.instance.store.state))).toBe('1');
  });

  it('adds field members to the fields whose value fits', () => {
    using subject = setup();
    subject.instance.field('name').change('  Ada ');

    expect([subject.instance.field('name').trimmed(), 'trimmed' in subject.instance.field('age')]).toEqual(['Ada', false]);
  });

  it('runs its submit hook', async () => {
    using subject = setup();
    await subject.instance.submit.run();

    expect(subject.log).toEqual(['tracked']);
  });

  it('cleans up at destroy', () => {
    using subject = setup();
    subject.instance.destroy();
    subject.instance.values.set('name', 'after');

    expect([subject.cleanup.mock.calls.length, subject.instance.store.state.edits]).toEqual([1, 0]);
  });
});

describe('two custom extensions', () => {
  it.each([
    ['first', 'second'],
    ['second', 'first'],
  ])('run their hooks in the order applied: %s, then %s', async (first, second) => {
    using _subject = setup();
    const log: string[] = [];
    const instance = base().extend(hooked(first!, log)).extend(hooked(second!, log)).create();
    await instance.submit.run();
    instance.destroy();

    expect(log).toEqual([first, second]);
  });
});
