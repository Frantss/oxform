import { describe, expect, it, vi } from 'vite-plus/test';
import { createEffect } from '#main/effect';
import { defineExtension, defineForm } from '#main/form';
import type { Extendable, Needs } from '#main/types';
import { schemaOf } from '../../tests/helpers';
import type { CheckApi, CheckEntry } from './check';
import { status, statusInternals, type DefaultFieldStatus, type FormStatusDefaults } from './status';
import { registerCheck, validation } from './validation';
import { values } from './values';

type Profile = { name: string; address: { city: string }; tags: string[] };

const defaultValues: Profile = { name: '', address: { city: '' }, tags: ['a', 'b'] };

type Options = { defaultStatus?: FormStatusDefaults; defaultFieldStatus?: DefaultFieldStatus<Profile> };

/** A test-local blocking check `error` with no validator. Its entries are in a state slice, so the status follows them. */
const errorCheck = <Values>(form: Extendable<Values, Needs<Values, 'validation'>>) =>
  defineExtension(form, {
    name: 'check:error',
    needs: { api: ['validation'] },
    state: () => ({ error: {} as Readonly<Record<string, readonly CheckEntry[]>> }),
    api: (context, deps) => {
      const slice = context.state.error;
      const check = {
        name: 'error',
        blocking: true,
        at: (path: string, options?: { nested?: boolean }) =>
          Object.entries(slice.get()).flatMap(([key, entries]) =>
            key === path || (options?.nested && (path === '' || key.startsWith(`${path}.`))) ? entries : [],
          ),
        set: (path: string, entries: readonly CheckEntry[]) => slice.set(current => ({ ...current, [path]: entries })),
      };
      registerCheck(deps.validation, { check: check as unknown as CheckApi<unknown>, validatorFor: () => undefined, refresh: () => {} });
      return { error: check };
    },
  });

/**
 * `values` and `status`, or with `validation` and a test-local blocking check `error` in between. `edit` stands in for
 * a field change of `events`: it writes the value, and marks the field dirty and touched when the write happens.
 */
const setup = ({ checked = false, ...options }: Options & { checked?: boolean } = {}) => {
  const base = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(values);
  const form = checked ? base.extend(validation).extend(errorCheck).extend(status) : base.extend(status);
  const instance = form.create(options);
  const internals = statusInternals(instance.status);

  return {
    form,
    instance,
    internals,
    error: (instance as unknown as { error: { set(path: string, entries: { message: string }[]): void } }).error,
    edit: (path: 'name' | 'address.city' | 'tags.0', value: string) => {
      if (instance.values.set(path, value)) internals.mark(path, { dirty: true, touched: true });
    },
    [Symbol.dispose]: () => instance.destroy(),
  };
};

describe('status as an extension', () => {
  it('throws at create without values, and names status and the need', () => {
    using _subject = setup();
    const lacking = defineForm({ schema: schemaOf<Profile>(), defaultValues }).extend(status as never);

    expect(() => lacking.create()).toThrow('The "status" extension needs "values", which no earlier extension provides.');
  });

  it('finds every path valid and nothing validating on a chain without validation', () => {
    using subject = setup();

    expect([subject.instance.status.at('name').valid, subject.instance.status.form]).toEqual([
      true,
      expect.objectContaining({ valid: true, validating: false }),
    ]);
  });
});

describe('field marks', () => {
  it('mark the field and its ancestors, and no sibling and no descendant', () => {
    using subject = setup();
    subject.edit('address.city', 'Paris');
    const at = (path: Parameters<typeof subject.instance.status.at>[0]) => subject.instance.status.at(path);

    expect([at('address.city'), at('address'), at('name').dirty, subject.instance.status.form]).toEqual([
      expect.objectContaining({ dirty: true, pristine: false, touched: true }),
      expect.objectContaining({ dirty: true, touched: true }),
      false,
      expect.objectContaining({ dirty: true, pristine: false, touched: true, blurred: false }),
    ]);
  });

  it('leave a flag off when the mark does not set it', () => {
    using subject = setup();
    subject.internals.mark('name', { touched: true });

    expect(subject.instance.status.at('name')).toEqual(expect.objectContaining({ dirty: false, touched: true }));
  });

  it('are not set by a refused change', () => {
    using subject = setup();
    subject.instance.values.intercept((_change, details) => details.cancel());
    subject.edit('name', 'a');

    expect(subject.instance.status.at('name').dirty).toBe(false);
  });

  it('keep dirty after a value returns to its default, while default follows the values', () => {
    using subject = setup();
    subject.edit('name', 'x');
    const changed = subject.instance.status.at('name').default;
    subject.edit('name', '');

    expect([changed, subject.instance.status.at('name')]).toEqual([false, expect.objectContaining({ dirty: true, default: true })]);
  });
});

describe('valid', () => {
  it('reads the own path for a field and every path for the form', () => {
    using subject = setup({ checked: true });
    subject.error.set('name', [{ message: 'Bad' }]);
    const { status: current } = subject.instance;

    expect([current.at('name').valid, current.at('address.city').valid, current.form.valid]).toEqual([false, true, false]);
  });

  it('follows the issues', () => {
    using subject = setup({ checked: true });
    const effect = vi.fn();
    createEffect(subject.instance, state => state.status.form.valid, effect);
    subject.error.set('name', [{ message: 'Bad' }]);
    subject.error.set('name', []);

    expect(effect.mock.calls).toEqual([[false], [true]]);
  });
});

describe('default status', () => {
  it('applies the wildcard to every field, and a path over the wildcard', () => {
    using subject = setup({ defaultFieldStatus: { '*': { touched: true }, name: { touched: false, dirty: true } } });
    const at = (path: Parameters<typeof subject.instance.status.at>[0]) => subject.instance.status.at(path);

    expect([at('address.city').touched, at('name')]).toEqual([true, expect.objectContaining({ touched: false, dirty: true })]);
  });

  it('applies the form defaults', () => {
    using subject = setup({ defaultStatus: { submits: 2, successful: true } });

    expect(subject.instance.status.form).toEqual(expect.objectContaining({ submits: 2, submitted: true, successful: true }));
  });

  it('keeps form pristine when submit sets form dirty', () => {
    using subject = setup();
    subject.internals.setForm({ dirty: true });

    expect(subject.instance.status.form).toEqual(expect.objectContaining({ dirty: true, pristine: true }));
  });
});

describe('derived status', () => {
  it('holds an entry for each node of the values', () => {
    using subject = setup();

    expect(Object.keys(subject.instance.store.state.status.fields)).toEqual(['name', 'address', 'address.city', 'tags', 'tags.0', 'tags.1']);
  });

  it('holds the form and the fields, and none of the raw flags', () => {
    using subject = setup();

    expect(Object.keys(subject.instance.store.state.status)).toEqual(['form', 'fields']);
  });

  it('is what status.form and status.at read', () => {
    using subject = setup();
    subject.edit('name', 'Ada');
    const { state } = subject.instance.store;

    expect([subject.instance.status.form, subject.instance.status.at('name')]).toEqual([state.status.form, state.status.fields.name]);
  });

  it('gives a path that is not a node of the values its defaults', () => {
    using subject = setup();

    expect(subject.instance.status.at('tags.5' as never)).toEqual({
      dirty: false,
      pristine: true,
      touched: false,
      blurred: false,
      valid: true,
      default: true,
    });
  });

  it('follows array items, which gain and lose entries and keep their flags', () => {
    using subject = setup();
    subject.edit('tags.0', 'x');
    subject.instance.values.set('tags', ['b', 'x', 'c']);
    subject.internals.remap('tags', index => index + 1);
    const { fields } = subject.instance.store.state.status;

    expect([fields['tags.2'], fields['tags.0']!.dirty, fields['tags.1']!.dirty]).toEqual([expect.any(Object), false, true]);
  });

  it('drops the flags of a removed item', () => {
    using subject = setup();
    subject.edit('tags.0', 'x');
    subject.internals.remap('tags', index => (index === 0 ? undefined : index - 1));

    expect(subject.instance.status.at('tags.0').dirty).toBe(false);
  });

  it('shows validating while a run is pending', async () => {
    using subject = setup({ checked: true });
    const pending = (subject.instance as unknown as { validation: { run(): Promise<unknown> } }).validation.run();
    const during = subject.instance.status.form.validating;
    await pending;

    expect([during, subject.instance.status.form.validating]).toEqual([true, false]);
  });

  it('shows the submit flags', () => {
    using subject = setup();
    subject.internals.setForm({ submitting: true, submits: 1, successful: false });

    expect(subject.instance.status.form).toEqual(expect.objectContaining({ submitting: true, submits: 1, submitted: true, successful: false }));
  });
});

describe('status reset', () => {
  it('starts the whole form again, with new form flags and a new generation', () => {
    using subject = setup();
    subject.edit('name', 'x');
    subject.internals.setForm({ submits: 3 });
    subject.internals.reset({ status: { submits: 1 } });

    expect([subject.instance.status.at('name').dirty, subject.instance.status.form.submits, subject.internals.generation()]).toEqual([false, 1, 1]);
  });

  it('keeps the field flags when it is asked to', () => {
    using subject = setup();
    subject.edit('name', 'x');
    subject.internals.reset({ keepFields: true });

    expect(subject.instance.status.at('name').dirty).toBe(true);
  });

  it('resets one subtree, and keeps the form and the other fields', () => {
    using subject = setup();
    subject.edit('address.city', 'x');
    subject.edit('name', 'y');
    subject.internals.reset({ path: 'address' });

    expect([subject.instance.status.at('address.city').dirty, subject.instance.status.at('name').dirty, subject.internals.generation()]).toEqual([
      false,
      true,
      0,
    ]);
  });
});

describe('memoization', () => {
  it('does not fire a selector of a field for an unrelated field', () => {
    using subject = setup();
    const effect = vi.fn();
    createEffect(subject.instance, state => state.status.fields.name, effect);
    subject.edit('address.city', 'Paris');

    expect(effect).not.toHaveBeenCalled();
  });
});
