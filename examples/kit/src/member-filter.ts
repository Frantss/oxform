import { defineForm, slots, type InstanceOf } from '@oxform/core';
import { events, fieldSlots, status, values } from '@oxform/core/behaviors';
import { emptyMemberFilter, memberFilterSchema } from './schemas/member-filter';

/**
 * E02. A filter bar changes a list as the user types. It has nothing to validate and nothing to submit, so it
 * has no `validation` and no `submit`, and it spreads no root group: its `Root` renders no element. */
export const memberFilter = defineForm({ schema: memberFilterSchema, defaultValues: emptyMemberFilter })
  .extend(values)
  .extend(status)
  .extend(events)
  .extend(slots(slot => fieldSlots(slot)));

/**
 * True while a filter differs from its default, which shows "Clear filters". `dirty` does not fit: it records an
 * interaction and stays set when the value comes back.
 */
export const hasFilters = (form: InstanceOf<typeof memberFilter>) =>
  !form.status.at('query').default || !form.status.at('role').default;
