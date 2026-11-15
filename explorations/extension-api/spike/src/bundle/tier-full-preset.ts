import { defineForm } from '../form';
import { standard } from '../standard';
import { acceptAll, type Login, loginDefaults } from './schema';

/** The full preset, with its slots. */
export const form = defineForm({ name: 'full', schema: acceptAll<Login>(), defaultValues: loginDefaults }).extend(
  standard,
);
