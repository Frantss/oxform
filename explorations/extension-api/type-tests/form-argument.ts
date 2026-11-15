import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineExtension, defineForm, on, type Extendable, type Needs } from '../spike/src/api';
import { standard } from '../spike/src/standard';

declare const schema: StandardSchemaV1<{ name: string; age: number }>;
const base = defineForm({ schema, defaultValues: { name: '', age: 0 } });

/** Adds `flush` to the api and `shout` to every string field. */
const flush = <Values>(form: Extendable<Values, Needs<Values, 'field'>>) =>
  defineExtension(form, {
    name: 'flush',
    api: () => ({ flush: () => {} }),
    fields: on<string>((value): value is string => typeof value === 'string')(field => ({
      shout: () => field.get().toUpperCase(),
    })),
  });

// @ts-expect-error the form has no `field`, which the extension needs
defineForm({ schema, defaultValues: { name: '', age: 0 } }).extend(flush);

// `onSubmit` and `onInvalid` receive the form with the extensions applied so far: their api and field members.
base
  .extend(standard)
  .extend(flush)
  .configure({
    onSubmit: (values, form) => {
      form.flush();
      form.field('name').shout();
      values.name satisfies string;
    },
    onInvalid: (_issues, form) => {
      form.flush();
    },
  });

// The same through `create`.
base
  .extend(standard)
  .extend(flush)
  .create({
    onSubmit: (_values, form) => {
      form.flush();
    },
  });

// The preset alone still has no extension members.
base.extend(standard).configure({
  onSubmit: (_values, form) => {
    // @ts-expect-error no extension, no `flush`
    form.flush();
    // @ts-expect-error no extension, no `shout`
    form.field('name').shout();
    form.field('name').error();
  },
});

// Members follow the field's value type: `age` is a number, so it has no `shout`.
base
  .extend(standard)
  .extend(flush)
  .configure({
    onSubmit: (_values, form) => {
      // @ts-expect-error `shout` is only on string fields
      form.field('age').shout();
    },
  });
