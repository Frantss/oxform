import { check } from '../check';
import { events } from '../events';
import { defineForm } from '../form';
import { status } from '../status';
import { submit } from '../submit';
import { validation } from '../validation';
import { values } from '../values';
import { acceptAll, type Login, loginDefaults } from './schema';

/** A lean login form: values, validation, one check, status, events and submit. No arrays, reset, handles or slots. */
export const login = defineForm({ name: 'login', schema: acceptAll<Login>(), defaultValues: loginDefaults })
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(submit);
