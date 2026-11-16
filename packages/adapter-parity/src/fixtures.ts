import { defineExtension, defineForm, defineScope, slots, type Extendable } from '@oxform/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  check,
  events,
  fieldErrorSlots,
  fieldSlots,
  rootSlots,
  status,
  submit,
  submitSlots,
  validation,
  values,
} from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';

/** A schema that accepts every value of `Values`. */
const schemaOf = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'oxform-parity', validate: value => ({ value: value as Values }) },
});

/** A schema that reports `message` at each of `keys` while the value there is the empty string. */
export const required = (...keys: readonly string[]): StandardSchemaV1<never> => ({
  '~standard': {
    version: 1,
    vendor: 'oxform-parity',
    validate: value => {
      const issues = keys
        .filter(key => (value as Record<string, unknown>)[key] === '')
        .map(key => ({ message: `${key} is required`, path: [key] }));
      return issues.length > 0 ? { issues } : { value: value as never };
    },
  },
});

export type SignIn = { email: string; password: string };

/** The quick start form: the lean sign-in chain, with its slots (`04-documentation.md#5.1`). */
export const signIn = defineForm({
  name: 'sign-in',
  schema: schemaOf<SignIn>(),
  defaultValues: { email: '', password: '' },
})
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(submit)
  .extend(slots(slot => ({ ...rootSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot) })))
  .configure({ error: { submit: required('email', 'password') } });

/** A form with fields and no `root` slot. */
export const bare = defineForm({ schema: schemaOf<{ name: string }>(), defaultValues: { name: '' } })
  .extend(values)
  .extend(status)
  .extend(events)
  .extend(slots(slot => ({ ...fieldSlots(slot) })));

/** Counts the unmounts of an instance: each one runs the cleanups. */
const probe = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'probe',
    api: context => {
      let cleanups = 0;
      context.onDestroy(() => void cleanups++);
      return {
        probe: {
          get cleanups() {
            return cleanups;
          },
        },
      };
    },
  });

export type Address = { street: string; geo: { lat: number } };

export const address = defineScope({ schema: schemaOf<Address>(), defaultValues: { street: '', geo: { lat: 0 } } });

export type Profile = {
  name: string;
  email: string;
  agree: boolean;
  plan: string;
  color: string;
  tags: string[];
  age: number | undefined;
  avatar: File | null;
  items: { label: string }[];
};

/** The `standard` preset with every kind of input, an array, a placed scope and the probe. */
export const profile = defineForm({
  schema: schemaOf<Profile>(),
  defaultValues: {
    name: '',
    email: '',
    agree: false,
    plan: 'free',
    color: 'red',
    tags: [],
    age: undefined,
    avatar: null,
    items: [{ label: 'a' }, { label: 'b' }],
  },
  scopes: { address },
})
  .extend(standard)
  .extend(probe);

export const fixtures = { signIn, bare, profile };
