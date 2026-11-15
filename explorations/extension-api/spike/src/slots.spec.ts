import { describe, expect, it, vi } from 'vitest';
import type { CheckState, EventsApi, Extendable, Needs, ResetApi, StatusState, SubmitApi } from './api';
import { defineExtension, defineForm, slots, slotsOf } from './form';
import { fieldErrorSlots, fieldSlots, resetSlots, rootSlots, submitSlots } from './slots';
import { createProfileForm, defaultProfile, profileForm, schemaOf, type Profile } from './test-helpers';
import { values } from './values';

type AnySlot = {
  element?: string;
  text?(state: unknown): string | undefined;
  present?(state: unknown, part: unknown): boolean;
  state?(state: unknown, part: unknown): unknown;
  attrs?(state: unknown, part: unknown): Record<string, unknown>;
  on?: Record<string, (event: unknown, context: unknown) => void>;
  bind?(element: unknown, part: unknown): void;
};
const slot = (form: object, key: string) => (slotsOf(form) as Record<string, AnySlot>)[key]!;

/**
 * Slot bodies read plain state and `part.api`, so these specs need no behaviors. The stand-in only provides the apis
 * and the state the groups need. The slots come from `slots(...)`, which declares nothing: each group checks its needs
 * against the form it is applied to. The preset's own composition is checked at the end.
 */
const apis = <Values>(form: Extendable<Values, Needs<Values, 'values'>, { values: Values }>) =>
  defineExtension(form, {
    name: 'apis',
    state: () => ({ status: {} as StatusState, error: {} as CheckState }),
    api: () => ({}) as { events: EventsApi<Values>; submit: SubmitApi<Values>; reset: ResetApi<Values> },
  });

const base = () => defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile }).extend(values);
const groups = base()
  .extend(apis)
  .extend(
    slots(slot => ({
      ...fieldSlots(slot),
      ...fieldErrorSlots(slot),
      ...submitSlots(slot),
      ...resetSlots(slot),
      ...rootSlots(slot),
    })),
  );

/** What an adapter passes to a slot body: plain state, never methods. */
const plainState = {
  values: { name: 'Ada' },
  status: {
    form: { submitting: true, submits: 2, successful: false },
    fields: { name: { valid: false, dirty: true, touched: true, blurred: false } },
  },
  error: { name: [{ message: 'Taken' }] },
};
const part = { key: 'name', id: 'f1', props: {} };

describe('slot groups', () => {
  it('resolve one key per part', () => {
    expect(Object.keys(slotsOf(groups)).sort()).toEqual(['field', 'fieldError', 'reset', 'root', 'submit']);
  });

  it('declare the default element of each part, and fieldError the text it shows without children', () => {
    const elements = Object.fromEntries(Object.entries(slotsOf(groups) as Record<string, AnySlot>).map(([name, { element }]) => [name, element]));

    expect(elements).toEqual({ root: 'form', field: 'input', fieldError: 'p', submit: 'button', reset: 'button' });
    expect(slot(groups, 'fieldError').text!({ messages: ['A', 'B'] })).toBe('A');
  });

  it('field reads plain state into attributes', () => {
    expect(slot(groups, 'field').attrs!(plainState, part)).toEqual({
      name: 'name',
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
    const values = { onChange: vi.fn(() => vi.fn()) };
    const context = { api: { events, values }, ...part, el: { type: 'text', value: 'x' } };
    const field = slot(groups, 'field');

    field.on!.input!({}, context);
    field.on!.focus!({}, context);
    field.on!.blur!({}, context);
    field.bind!({}, context);

    expect(events.change).toHaveBeenCalledWith('name', 'x');
    expect(events.focus).toHaveBeenCalledWith('name');
    expect(events.blur).toHaveBeenCalledWith('name');
    expect(events.register).toHaveBeenCalledWith('name');
  });

  it('fieldError is present only with errors, and exposes the messages', () => {
    const fieldError = slot(groups, 'fieldError');

    expect(fieldError.present!(plainState, part)).toBe(true);
    expect(fieldError.present!({ ...plainState, error: {} }, part)).toBe(false);
    expect(fieldError.state!(plainState, part)).toEqual({ messages: ['Taken'] });
    expect(fieldError.attrs!(plainState, part)).toEqual({ id: 'f1-name-error', role: 'alert' });
  });

  it('submit reads the form status, and reset is a reset button', () => {
    expect(slot(groups, 'submit').state!(plainState, part)).toEqual({
      submitting: true,
      submits: 2,
      successful: false,
    });
    expect(slot(groups, 'submit').attrs!(plainState, part)).toMatchObject({ type: 'submit', disabled: true });
    expect(slot(groups, 'reset').attrs!(plainState, part)).toEqual({ type: 'reset' });
  });

  it('root prevents the default and calls submit and reset', () => {
    const api = { submit: { run: vi.fn() }, reset: { all: vi.fn() } };
    const event = { preventDefault: vi.fn() };
    const root = slot(groups, 'root');

    root.on!.submit!(event, { api });
    root.on!.reset!(event, { api });

    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(api.submit.run).toHaveBeenCalledOnce();
    expect(api.reset.all).toHaveBeenCalledOnce();
  });
});

describe('reusing and extending slots', () => {
  it('a group spreads into any form, and the form keeps only the groups it spreads', () => {
    const errorsOnly = <Values>(form: Extendable<Values>) =>
      defineExtension(form, {
        name: 'errors-only',
        state: () => ({ error: {} as CheckState }),
        api: () => ({}),
        slots: slot => ({ ...fieldErrorSlots(slot) }),
      });

    expect(Object.keys(slotsOf(base().extend(errorsOnly)))).toEqual(['fieldError']);
  });

  it('an extension adds a slot, and a slot with a base key replaces the base slot', () => {
    const extra = <Values>(form: Extendable<Values>) =>
      defineExtension(form, {
        name: 'extra',
        api: () => ({}),
        slots: slot => ({
          autosaveStatus: slot({ attrs: () => ({ role: 'status' }) }),
          reset: slot({ attrs: () => ({ type: 'button' }) }),
        }),
      });
    const extended = groups.extend(extra);

    expect(Object.keys(slotsOf(extended)).sort()).toEqual(['autosaveStatus', 'field', 'fieldError', 'reset', 'root', 'submit']);
    expect(slot(extended, 'reset').attrs!({}, {})).toEqual({ type: 'button' });
    expect(slot(extended, 'autosaveStatus').attrs!({}, {})).toEqual({ role: 'status' });
    expect(slot(groups, 'reset').attrs!({}, {})).toEqual({ type: 'reset' });
  });

  it('resolve in the order of the extensions, so the later slot wins', () => {
    const first = <Values>(form: Extendable<Values>) =>
      defineExtension(form, { name: 'first', api: () => ({}), slots: slot => ({ badge: slot({ attrs: () => ({ id: 'a' }) }) }) });
    const second = <Values>(form: Extendable<Values>) =>
      defineExtension(form, { name: 'second', api: () => ({}), slots: slot => ({ badge: slot({ attrs: () => ({ id: 'b' }) }) }) });

    expect(slot(base().extend(first).extend(second), 'badge').attrs!({}, {})).toEqual({ id: 'b' });
    expect(slot(base().extend(second).extend(first), 'badge').attrs!({}, {})).toEqual({ id: 'a' });
  });
});

describe('slot-only extensions', () => {
  it('add slots and nothing else: no api, no option, no state', () => {
    const before = base().create();
    const form = base().extend(slots(slot => ({ badge: slot({ attrs: () => ({ id: 'a' }) }) })));
    const after = form.create();

    expect(Object.keys(slotsOf(form))).toEqual(['badge']);
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
    expect(after.store.state).toEqual(before.store.state);
    expect(form.optionKinds).toEqual(base().optionKinds);
  });

  it('merge across extend calls, and a later slot replaces an earlier one with the same key', () => {
    const form = base()
      .extend(slots(slot => ({ badge: slot({ attrs: () => ({ id: 'a' }) }), kept: slot({ element: 'i' }) })))
      .extend(slots(slot => ({ badge: slot({ attrs: () => ({ id: 'b' }) }), added: slot({ element: 'b' }) })));

    expect(Object.keys(slotsOf(form)).sort()).toEqual(['added', 'badge', 'kept']);
    expect(slot(form, 'badge').attrs!({}, {})).toEqual({ id: 'b' });
  });

  it('replace a slot of a group, and leave the form that was extended unchanged', () => {
    const replaced = groups.extend(slots(slot => ({ reset: slot({ attrs: () => ({ type: 'button' }) }) })));

    expect(slot(replaced, 'reset').attrs!({}, {})).toEqual({ type: 'button' });
    expect(slot(groups, 'reset').attrs!({}, {})).toEqual({ type: 'reset' });
  });

  it('read the state of the form they are applied to', () => {
    const shownState = <Values>(form: Extendable<Values>) =>
      defineExtension(form, { name: 'shown', state: () => ({ shown: true }), api: () => ({}) });
    const form = base()
      .extend(shownState)
      .extend(slots(slot => ({ badge: slot({ attrs: state => ({ 'data-shown': state.shown }) }) })));

    expect(slot(form, 'badge').attrs!(form.create().store.state, {})).toEqual({ 'data-shown': true });
  });
});

/** The preset's slots and the real store state need the preset, which is complete in phase 3. */
describe('the preset slots', () => {
  it('resolve the preset slots, one key per part', () => {
    expect(Object.keys(slotsOf(profileForm)).sort()).toEqual(['field', 'fieldError', 'reset', 'root', 'submit']);
  });

  it('field reads the real store state: valid until the check holds an issue for it', () => {
    const form = createProfileForm();
    const attrs = () => slot(profileForm, 'field').attrs!(form.store.state, { key: 'name', id: 'f1', props: {} });
    form.events.change('name', 'Ada');

    expect(attrs()).toMatchObject({ value: 'Ada', 'aria-invalid': undefined, 'data-dirty': '' });

    form.error.set('name', [{ message: 'Taken' }]);
    expect(attrs()).toMatchObject({ 'aria-invalid': true, 'aria-describedby': 'f1-name-error' });
  });

  it('fieldError and submit read the real store state', () => {
    const form = createProfileForm();
    form.error.set('name', [{ message: 'Taken' }]);

    expect(slot(profileForm, 'fieldError').state!(form.store.state, { key: 'name', id: 'f1' })).toEqual({
      messages: ['Taken'],
    });
    expect(slot(profileForm, 'submit').state!(form.store.state, {})).toEqual({
      submitting: false,
      submits: 0,
      successful: null,
    });
  });
});
