import { check } from '../check';
import { defineForm } from '../form';
import { defineScope } from '../scopes';
import { validation } from '../validation';
import { values } from '../values';
import { acceptAll, type Login, loginDefaults } from './schema';

const address = defineScope({ schema: acceptAll<Login>(), defaultValues: loginDefaults });

/** The same form with a placed scope. Scopes are opt-in: the form does not import them otherwise. */
export const form = defineForm({
  name: 'scopes',
  schema: acceptAll<{}>(),
  defaultValues: {},
  scopes: { billing: address },
})
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }));
