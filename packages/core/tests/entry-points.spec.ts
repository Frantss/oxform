import { expect, it } from 'vite-plus/test';
import { defineForm, slots } from '#core';
import { slotsOf } from '#core/adapter';
import { status, submitSlots } from '#core/behaviors';
import { standard } from '#core/presets';
import { schemaOf } from './helpers';

const setup = () => ({
  form: defineForm({ schema: schemaOf<object>(), defaultValues: {} })
    .extend(standard)
    .extend(status)
    .extend(slots(slot => ({ ...submitSlots(slot) }))),
  [Symbol.dispose]() {},
});

it('builds a form through the main, behaviors, presets and adapter barrels', () => {
  using subject = setup();

  expect(Object.keys(slotsOf(subject.form))).toEqual(['submit']);
});
