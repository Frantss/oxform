import { describe, expect, it } from 'vite-plus/test';
import { named } from '../../tests/helpers';
import { defineForm, defineSlots, slotsOf, type Form } from './form';

describe('form.extend', () => {
  it('adds an extension to the chain of a new form', () => {
    expect(slotsOf(defineForm().extend(named('first')).extend(named('second')))).toEqual(['first', 'second']);
  });

  it('returns the form of a preset', () => {
    const preset = (form: Form) => form.extend(named('preset'));

    expect(slotsOf(defineForm().extend(preset))).toEqual(['preset']);
  });
});

describe('slotsOf', () => {
  it('refuses an object that defineForm did not make', () => {
    expect(() => slotsOf({ extend: () => defineForm() })).toThrow('slotsOf expects a form made by defineForm.');
  });
});

describe('defineSlots', () => {
  it('records the name of the group beside its slots', () => {
    expect(defineSlots({ name: 'group' }, () => ({ part: {} }))).toEqual({ name: 'group', slots: { part: {} } });
  });
});
