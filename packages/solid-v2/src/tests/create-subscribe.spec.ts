import { withRoot } from '#tests/setup';
import { createForm, createSubscribe } from 'oxform-solid/v2';
import { createEffect, flush } from 'solid-js';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

it('should use Object.is equality including NaN and signed zero', () => {
  const { form, value, read } = withRoot(() => {
    const form = createForm({ schema: z.object({ number: z.number() }), defaultValues: { number: Number.NaN } });
    const value = createSubscribe(form, state => state.values.number);
    const read = vi.fn();
    createEffect(value, read);
    return { form, value, read };
  });
  form.field.change('number', Number.NaN);
  flush();
  expect(read).toHaveBeenCalledOnce();
  form.field.change('number', 0);
  flush();
  form.field.change('number', -0);
  flush();
  expect(read).toHaveBeenCalledTimes(3);
  expect(Object.is(value(), -0)).toBe(true);
});
