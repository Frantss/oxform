import { expect, it } from 'vite-plus/test';
import { defineForm } from '#core';
import { slotsOf } from '#core/adapter';
import { rootSlots } from '#core/behaviors';
import { standard } from '#core/presets';
import { schemaOf } from './helpers';

const setup = () => ({
  form: defineForm({ schema: schemaOf<object>(), defaultValues: {} }).extend(standard),
  group: rootSlots,
  [Symbol.dispose]() {},
});

it('builds a form through the main, behaviors, presets and adapter barrels', () => {
  using subject = setup();

  expect({ chain: slotsOf(subject.form), group: subject.group.name }).toEqual({
    chain: ['values'],
    group: 'rootSlots',
  });
});
