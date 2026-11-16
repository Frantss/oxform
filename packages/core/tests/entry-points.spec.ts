import { expect, it } from 'vite-plus/test';
import { defineForm } from '#core';
import { slotsOf } from '#core/adapter';
import { rootSlots } from '#core/behaviors';
import { standard } from '#core/presets';

it('builds a form through the main, behaviors, presets and adapter barrels', () => {
  const form = defineForm().extend(standard);

  expect({ chain: slotsOf(form), group: rootSlots.name }).toEqual({ chain: ['values'], group: 'rootSlots' });
});
