import { describe, expect, it } from 'vite-plus/test';
import { defineExtension, defineForm, type Extendable } from '#core';
import { slotsOf } from '#core/adapter';
import { standard } from '#core/presets';

type Login = { email: string; tags: string[] };

const schema = { '~standard': { version: 1 as const, vendor: 'test', validate: (value: unknown) => ({ value: value as Login }) } };

/** An extension that applies before `standard`. */
const before = <Values>(form: Extendable<Values>) => defineExtension(form, { name: 'before', api: () => ({ before: true }) });

/** `defineForm(...).extend(standard)`, and its instance. */
const setup = () => {
  const form = defineForm({ schema, defaultValues: { email: '', tags: [] } as Login }).extend(standard);
  const instance = form.create({ id: 'login' });

  return { form, instance, [Symbol.dispose]: () => instance.destroy() };
};

describe('standard', () => {
  it('applies the nine extensions in order, with handles last', () => {
    using subject = setup();

    expect(Object.keys(subject.instance)).toEqual([
      'values',
      'validation',
      'error',
      'status',
      'events',
      'arrays',
      'reset',
      'submit',
      'field',
      'array',
      'scope',
      'id',
      'store',
      'destroy',
    ]);
  });

  it('gives one part for each slot of its four slot groups', () => {
    using subject = setup();

    expect(Object.keys(slotsOf(subject.form))).toEqual(['root', 'field', 'fieldError', 'submit', 'reset']);
  });

  it('applies to a form that already has extensions, and keeps its configured options', () => {
    using _subject = setup();
    const configured = defineForm({ schema, defaultValues: { email: '', tags: [] } as Login })
      .extend(before)
      .configure({ id: 'configured' })
      .extend(standard);
    const instance = configured.create();
    const result = [instance.before, instance.id];
    instance.destroy();

    expect(result).toEqual([true, 'configured']);
  });

  it('needs nothing, and makes a form that validates and submits', async () => {
    using subject = setup();
    subject.instance.error.set('email', [{ message: 'Taken' }]);
    await subject.instance.submit.run();

    expect(subject.instance.status.form).toEqual(expect.objectContaining({ submits: 1, successful: false }));
  });
});
