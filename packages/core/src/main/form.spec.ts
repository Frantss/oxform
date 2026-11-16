import { describe, expect, it } from 'vite-plus/test';
import { named } from '../../tests/helpers';
import { defineForm, defineSlots, slotsOf, type Form } from './form';

/** A new form, extended with each extension or preset in order. */
const setup = (...extensions: Parameters<Form['extend']>[0][]) => ({
  form: extensions.reduce<Form>((form, extension) => form.extend(extension), defineForm()),
  [Symbol.dispose]() {},
});

describe('form.extend', () => {
  it('adds an extension to the chain of a new form', () => {
    using subject = setup(named('first'), named('second'));

    expect(slotsOf(subject.form)).toEqual(['first', 'second']);
  });

  it('returns the form of a preset', () => {
    using subject = setup((form: Form) => form.extend(named('preset')));

    expect(slotsOf(subject.form)).toEqual(['preset']);
  });
});

describe('slotsOf', () => {
  it('refuses an object that defineForm did not make', () => {
    using subject = setup();

    expect(() => slotsOf({ extend: () => subject.form })).toThrow('slotsOf expects a form made by defineForm.');
  });
});

describe('defineSlots', () => {
  it('records the name of the group beside its slots', () => {
    using subject = setup();
    const group = defineSlots({ name: 'group' }, () => ({ form: subject.form }));

    expect(group).toEqual({ name: 'group', slots: { form: subject.form } });
  });
});
