import { describe, expect, it, vi } from 'vitest';
import { defineForm, extendForm, slotsOf } from './form';
import { fieldErrorSlots } from './slots';
import { standardForm } from './standard';
import { createProfileForm } from './test-helpers';

type AnySlot = {
  present?(state: unknown, part: unknown): boolean;
  state?(state: unknown, part: unknown): unknown;
  attrs?(state: unknown, part: unknown): Record<string, unknown>;
  on?: Record<string, (event: unknown, context: unknown) => void>;
  bind?(element: unknown, part: unknown): void;
};
const slot = (definition: object, key: string) => (slotsOf(definition) as Record<string, AnySlot>)[key]!;

/** What an adapter passes to a slot body: plain state, never methods. */
const plainState = {
  values: { name: 'Ada' },
  status: {
    form: { submitting: true, submits: 2, successful: false },
    fields: { name: { valid: false, dirty: true, touched: true, blurred: false } },
  },
  error: { name: [{ message: 'Taken' }] },
};
const part = { key: 'name', id: 'f1' };

describe('slot groups', () => {
  it('resolve the preset slots, one key per part', () => {
    expect(Object.keys(slotsOf(standardForm)).sort()).toEqual(['field', 'fieldError', 'reset', 'root', 'submit']);
  });

  it('field reads plain state into attributes', () => {
    expect(slot(standardForm, 'field').attrs!(plainState, part)).toEqual({
      value: 'Ada',
      'aria-invalid': true,
      'aria-describedby': 'f1-name-error',
      'data-dirty': '',
      'data-touched': '',
      'data-blurred': undefined,
    });
  });

  it('field drives the events api from the element events, and registers the element', () => {
    const events = { change: vi.fn(), focus: vi.fn(), blur: vi.fn(), register: vi.fn(() => vi.fn()) };
    const context = { api: { events }, ...part };
    const field = slot(standardForm, 'field');

    field.on!.input!({ target: { value: 'x' } }, context);
    field.on!.focus!({}, context);
    field.on!.blur!({}, context);
    field.bind!({}, context);

    expect(events.change).toHaveBeenCalledWith('name', 'x');
    expect(events.focus).toHaveBeenCalledWith('name');
    expect(events.blur).toHaveBeenCalledWith('name');
    expect(events.register).toHaveBeenCalledWith('name');
  });

  it('fieldError is present only with errors, and exposes the messages', () => {
    const fieldError = slot(standardForm, 'fieldError');

    expect(fieldError.present!(plainState, part)).toBe(true);
    expect(fieldError.present!({ ...plainState, error: {} }, part)).toBe(false);
    expect(fieldError.state!(plainState, part)).toEqual({ messages: ['Taken'] });
    expect(fieldError.attrs!(plainState, part)).toEqual({ id: 'f1-name-error', role: 'alert' });
  });

  it('submit reads the form status, and reset is a reset button', () => {
    expect(slot(standardForm, 'submit').state!(plainState, part)).toEqual({
      submitting: true,
      submits: 2,
      successful: false,
    });
    expect(slot(standardForm, 'submit').attrs!(plainState, part)).toMatchObject({ type: 'submit', disabled: true });
    expect(slot(standardForm, 'reset').attrs!(plainState, part)).toEqual({ type: 'reset' });
  });

  it('root prevents the default and calls submit and reset', () => {
    const api = { submit: { run: vi.fn() }, reset: { all: vi.fn() } };
    const event = { preventDefault: vi.fn() };
    const root = slot(standardForm, 'root');

    root.on!.submit!(event, { api });
    root.on!.reset!(event, { api });

    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(api.submit.run).toHaveBeenCalledOnce();
    expect(api.reset.all).toHaveBeenCalledOnce();
  });
});

describe('reusing and extending slots', () => {
  it('a group spreads into any form, and the form keeps only the groups it spreads', () => {
    const errorsOnly = defineForm<any>({
      name: 'errors-only',
      options: {},
      api: () => ({}),
      slots: slot => ({ ...fieldErrorSlots(slot) }),
    });

    expect(Object.keys(slotsOf(errorsOnly))).toEqual(['fieldError']);
  });

  it('an extension adds a slot, and a slot with a base key replaces the base slot', () => {
    const extended = extendForm(standardForm, {
      name: 'extra',
      api: () => ({}),
      slots: (slot: (definition: object) => object) => ({
        autosaveStatus: slot({ attrs: () => ({ role: 'status' }) }),
        reset: slot({ attrs: () => ({ type: 'button' }) }),
      }),
    } as never);

    expect(Object.keys(slotsOf(extended)).sort()).toEqual(['autosaveStatus', 'field', 'fieldError', 'reset', 'root', 'submit']);
    expect(slot(extended, 'reset').attrs!({}, {})).toEqual({ type: 'button' });
    expect(slot(extended, 'autosaveStatus').attrs!({}, {})).toEqual({ role: 'status' });
    expect(slot(standardForm, 'reset').attrs!({}, {})).toEqual({ type: 'reset' });
  });

  it('field reads the real store state: valid until the check holds an issue for it', () => {
    const form = createProfileForm();
    const attrs = () => slot(standardForm, 'field').attrs!(form.store.state, { key: 'name', id: 'f1' });
    form.events.change('name', 'Ada');

    expect(attrs()).toMatchObject({ value: 'Ada', 'aria-invalid': undefined, 'data-dirty': '' });

    form.error.set('name', [{ message: 'Taken' }]);
    expect(attrs()).toMatchObject({ 'aria-invalid': true, 'aria-describedby': 'f1-name-error' });
  });

  it('fieldError and submit read the real store state', () => {
    const form = createProfileForm();
    form.error.set('name', [{ message: 'Taken' }]);

    expect(slot(standardForm, 'fieldError').state!(form.store.state, { key: 'name', id: 'f1' })).toEqual({
      messages: ['Taken'],
    });
    expect(slot(standardForm, 'submit').state!(form.store.state, {})).toEqual({
      submitting: false,
      submits: 0,
      successful: null,
    });
  });
});
