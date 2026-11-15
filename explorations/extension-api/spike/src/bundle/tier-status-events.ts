import { events } from '../events';
import { defineForm } from '../form';
import { status } from '../status';
import { values } from '../values';
import { acceptAll, type Login, loginDefaults } from './schema';

/** Values, status and events. No validation: `status` and `events` use it only when it is there. */
export const form = defineForm({ name: 'status', schema: acceptAll<Login>(), defaultValues: loginDefaults })
  .extend(values)
  .extend(status)
  .extend(events);
