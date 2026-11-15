import { check } from '../check';
import { defineForm } from '../form';
import { validation } from '../validation';
import { values } from '../values';
import { acceptAll, type Login, loginDefaults } from './schema';

/** Values, validation and one check. */
export const form = defineForm({ name: 'checked', schema: acceptAll<Login>(), defaultValues: loginDefaults })
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }));
