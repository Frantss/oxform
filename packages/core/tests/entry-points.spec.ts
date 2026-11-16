import { expect, it } from 'vite-plus/test';
import { defineForm, slots } from '#core';
import { slotsOf } from '#core/adapter';
import { rootSlots } from '#core/behaviors';
import { standard } from '#core/presets';
import { schemaOf } from './helpers';

const setup = () => ({
  form: defineForm({ schema: schemaOf<object>(), defaultValues: {} })
    .extend(standard)
    .extend(slots(slot => ({ ...rootSlots(slot) }))),
  [Symbol.dispose]() {},
});

it('builds a form through the main, behaviors, presets and adapter barrels', () => {
  using subject = setup();

  expect(Object.keys(slotsOf(subject.form))).toEqual(['root']);
});
