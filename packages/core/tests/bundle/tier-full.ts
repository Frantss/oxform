import { defineForm } from '@oxform/core';
import { rootSlots } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';

export const form = defineForm().extend(standard);
export const slots = rootSlots;
