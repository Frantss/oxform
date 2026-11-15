import { defineForm } from '../form';
import { values } from '../values';
import { acceptAll, type Login, loginDefaults } from './schema';

/** The smallest form: values only. It also shows what the builder runtime costs on its own. */
export const form = defineForm({ name: 'values', schema: acceptAll<Login>(), defaultValues: loginDefaults }).extend(
  values,
);
