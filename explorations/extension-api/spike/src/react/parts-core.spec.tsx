import { expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';
import type { CheckState, EventsApi, Extendable, Needs, ResetApi, StatusState, SubmitApi } from '../api';
import { defineExtension, defineForm } from '../form';
import { fieldErrorSlots, fieldSlots, resetSlots, rootSlots, submitSlots } from '../slots';
import { defaultProfile, schemaOf, type Profile } from '../test-helpers';
import { values } from '../values';
import { createParts, usePart } from './create-parts';

/**
 * The adapter needs only a form with slots. This stand-in gives `values` the apis and state that the preset's slot
 * groups read, so the adapter is checked without the other behaviors. `parts.spec.tsx` runs it on the full preset.
 */
const cleanups = vi.fn();
const parts = <Values,>(form: Extendable<Values, Needs<Values, 'values'>, { values: Values }>) =>
  defineExtension(form, {
    name: 'parts',
    state: () => ({
      status: { form: { submitting: false, submits: 0, successful: null }, fields: {} } as unknown as StatusState,
      error: {} as CheckState,
    }),
    api: (ctx, { values }) => {
      ctx.onDestroy(cleanups);
      const events = {
        change: (path: string, value: unknown) => values.set(path as never, value as never),
        focus: () => {},
        blur: () => {},
        register: () => () => {},
        unregister: () => {},
      } as unknown as EventsApi<Values>;
      return {
        events,
        submit: { run: async () => {} } as unknown as SubmitApi<Values>,
        reset: { all: () => {} } as unknown as ResetApi<Values>,
      };
    },
    slots: slot => ({
      ...rootSlots(slot),
      ...fieldSlots(slot),
      ...fieldErrorSlots(slot),
      ...submitSlots(slot),
      ...resetSlots(slot),
    }),
  });

const form = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile }).extend(values).extend(parts);
const elements = { root: 'form', field: 'input', fieldError: 'p', submit: 'button', reset: 'button' } as const;

it('renders the form’s own slots and writes typing into the instance it is given', async () => {
  const { Root, Field, Submit } = createParts(form, elements);
  const instance = form.create();
  const screen = await render(
    <Root form={instance}>
      <Field name='name' aria-label='name' />
      <Submit>Send</Submit>
    </Root>,
  );

  await userEvent.type(screen.getByLabelText('name'), 'Ada');

  await expect.element(screen.getByLabelText('name')).toHaveValue('Ada');
  expect(instance.values.get('name')).toBe('Ada');
  await expect.element(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
});

it('gives option props to the instance it makes, and DOM props to the root element', async () => {
  const { Root, Field } = createParts(form, elements);
  const screen = await render(
    <Root data-testid='root' defaultValues={{ ...defaultProfile, name: 'Grace' }}>
      <Field name='name' aria-label='name' />
    </Root>,
  );

  await expect.element(screen.getByLabelText('name')).toHaveValue('Grace');
  await expect.element(screen.getByTestId('root')).toBeInTheDocument();
});

it('uses the element a slot declares, and the element the caller chooses', async () => {
  const { Root, FieldError, Field } = createParts(form, { ...elements, field: 'textarea' });
  const instance = form.create();
  const screen = await render(
    <Root form={instance}>
      <Field name='name' aria-label='name' />
      <FieldError name='name' />
    </Root>,
  );

  expect(screen.getByLabelText('name').element().tagName).toBe('TEXTAREA');
});

it('renders a part in another element with usePart, inside the form’s Root', async () => {
  const { Root } = createParts(form, elements);
  const Custom = () => usePart(form, 'field', { name: 'name' }, { 'aria-label': 'custom' }, 'textarea');
  const instance = form.create();
  const screen = await render(
    <Root form={instance}>
      <Custom />
    </Root>,
  );

  await userEvent.type(screen.getByLabelText('custom'), 'Ada');

  expect(screen.getByLabelText('custom').element().tagName).toBe('TEXTAREA');
  expect(instance.values.get('name')).toBe('Ada');
});

it('rejects an element for a part the form does not have', () => {
  expect(() => createParts(form, { nope: 'span' } as never)).toThrow('the form has no part "nope"');
});

it('stops the work of an instance it made when the component leaves', async () => {
  const { Root } = createParts(form, elements);
  cleanups.mockClear();
  const screen = await render(<Root />);

  expect(cleanups).not.toHaveBeenCalled();
  await screen.unmount();

  expect(cleanups).toHaveBeenCalledOnce();
});
