import {
  createArrayField,
  createEffect,
  createField,
  createForm,
  type FieldApi,
  type FormApi,
  type FormArrayFields,
  type FormFieldValue,
  type FormIssuesByLevel,
} from '../../export/index';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  profile: z.object({
    enabled: z.boolean(),
    address: z.object({
      city: z.string(),
    }),
  }),
  tags: z.string().array(),
  contacts: z
    .object({
      email: z.string(),
      phones: z
        .object({
          number: z.string(),
        })
        .array(),
    })
    .array(),
});

type Values = z.infer<typeof schema>;
type IssueLevels = 'error' | 'warning' | 'risk';
type Contact = Values['contacts'][number];

const defaultValues = {
  name: 'Ada',
  age: 36,
  profile: {
    enabled: true,
    address: {
      city: 'London',
    },
  },
  tags: ['admin'],
  contacts: [
    {
      email: 'ada@example.com',
      phones: [{ number: '555-0100' }],
    },
  ],
} satisfies Values;

const setupForm = () =>
  createForm({
    schema,
    defaultValues,
    checks: {
      warning: {
        validate: {
          change: store => {
            expectTypeOf(store.values.profile.address.city).toEqualTypeOf<string>();
            expectTypeOf(store.values.contacts).toEqualTypeOf<Contact[]>();

            return z.object({
              profile: z.object({
                address: z.object({
                  city: z.string().min(store.values.profile.address.city.length),
                }),
              }),
            });
          },
        },
      },
      risk: {
        blocking: true,
        validate: {
          submit: z.object({
            age: z.number().min(18),
          }),
        },
      },
    },
  });

it('covers the createForm schema inference contract', async () => {
  const form = setupForm();

  expectTypeOf(form.values).toEqualTypeOf<Values>();
  expectTypeOf(form.values.profile.enabled).toEqualTypeOf<boolean>();
  expectTypeOf(form.field.get('name')).toEqualTypeOf<string>();
  expectTypeOf(form.field.get('age')).toEqualTypeOf<number>();
  expectTypeOf(form.field.get('profile.address.city')).toEqualTypeOf<string>();
  expectTypeOf(form.field.get('tags')).toEqualTypeOf<string[]>();
  expectTypeOf(form.field.get('tags.0')).toEqualTypeOf<string | undefined>();
  expectTypeOf(form.field.get('contacts.0.email')).toEqualTypeOf<string | undefined>();
  expectTypeOf(form.field.get('contacts.0.phones.0.number')).toEqualTypeOf<string | undefined>();
  expectTypeOf(form.field.issues('name')).toEqualTypeOf<FormIssuesByLevel<IssueLevels>>();
  expectTypeOf(await form.validate('name')).toEqualTypeOf<[boolean, FormIssuesByLevel<IssueLevels>]>();

  form.submit(
    (values, submitForm) => {
      expectTypeOf(values).toEqualTypeOf<Values>();
      expectTypeOf(submitForm).toEqualTypeOf<FormApi<Values, IssueLevels>>();
    },
    (issues, submitForm) => {
      expectTypeOf(issues).toEqualTypeOf<FormIssuesByLevel<IssueLevels>>();
      expectTypeOf(submitForm).toEqualTypeOf<FormApi<Values, IssueLevels>>();
    },
  );

  const assertRejectedFormTypes = () => {
    createForm({
      schema,
      defaultValues: {
        ...defaultValues,
        // @ts-expect-error defaultValues must match the schema output type.
        age: '36',
      },
    });

    // @ts-expect-error field paths must come from the schema.
    form.field.get('profile.missing');

    // @ts-expect-error field writes must match the selected schema value.
    form.field.change('profile.enabled', 'yes');
  };

  expect(assertRejectedFormTypes).toBeDefined();
});

it('covers the createField schema inference contract', () => {
  const form = setupForm();
  const field = createField({ form, name: 'profile.address.city' });

  expectTypeOf(field).toEqualTypeOf<FieldApi<string, IssueLevels>>();
  expectTypeOf(field.state.value).toEqualTypeOf<string>();
  expectTypeOf(field.state.defaultValue).toEqualTypeOf<string>();
  expectTypeOf(field.issues()).toEqualTypeOf<FormIssuesByLevel<IssueLevels>>();

  field.change(current => {
    expectTypeOf(current).toEqualTypeOf<string>();
    return current.toUpperCase();
  });
  field.reset({ value: 'Paris' });

  const assertRejectedFieldTypes = () => {
    // @ts-expect-error field names must come from the form schema.
    createField({ form, name: 'profile.missing' });

    // @ts-expect-error field writes must match the selected field value.
    field.change(123);
  };

  expect(assertRejectedFieldTypes).toBeDefined();
});

it('covers the createArrayField schema inference contract', () => {
  const form = setupForm();
  const contacts = createArrayField({ form, name: 'contacts' });
  const tags = createArrayField({ form, name: 'tags' });

  expectTypeOf<'contacts'>().toMatchTypeOf<FormArrayFields<typeof form>>();
  expectTypeOf<'tags'>().toMatchTypeOf<FormArrayFields<typeof form>>();
  expectTypeOf<FormFieldValue<typeof form, 'contacts'>>().toEqualTypeOf<Contact[]>();
  expectTypeOf<FormFieldValue<typeof form, 'tags'>>().toEqualTypeOf<string[]>();
  expectTypeOf(contacts.state.value).toEqualTypeOf<Contact[]>();
  expectTypeOf(contacts.state.defaultValue).toEqualTypeOf<Contact[]>();
  expectTypeOf(tags.state.value).toEqualTypeOf<string[]>();

  const contactAppendValue: Parameters<typeof contacts.append>[0] = {
    email: 'grace@example.com',
    phones: [{ number: '555-0101' }],
  };
  const contactUpdateValue: Parameters<typeof contacts.update>[1] = current => {
    expectTypeOf(current).toEqualTypeOf<Contact>();
    return {
      ...current,
      email: current.email.toUpperCase(),
    };
  };
  const contactReplaceValue: Parameters<typeof contacts.replace>[0] = current => {
    expectTypeOf(current).toEqualTypeOf<Contact[]>();
    return current;
  };
  const tagAppendValue: Parameters<typeof tags.append>[0] = current => {
    expectTypeOf(current).toEqualTypeOf<string>();
    return current.toUpperCase();
  };

  expectTypeOf(contactAppendValue).toMatchTypeOf<Contact>();
  expectTypeOf(contactUpdateValue).toMatchTypeOf<Parameters<typeof contacts.update>[1]>();
  expectTypeOf(contactReplaceValue).toMatchTypeOf<Parameters<typeof contacts.replace>[0]>();
  expectTypeOf(tagAppendValue).toMatchTypeOf<Parameters<typeof tags.append>[0]>();

  const assertRejectedArrayTypes = () => {
    // @ts-expect-error array fields must be array-valued schema paths.
    createArrayField({ form, name: 'name' });

    // @ts-expect-error array items must match the selected array item type.
    contacts.append({ email: 'missing-phones@example.com' });

    // @ts-expect-error scalar array items must match the selected array item type.
    tags.append(123);
  };

  expect(assertRejectedArrayTypes).toBeDefined();
});

it('covers the createEffect schema inference contract', () => {
  const form = setupForm();

  createEffect(
    form,
    state => {
      expectTypeOf(state.values.age).toEqualTypeOf<number>();
      expectTypeOf(state.values.contacts).toEqualTypeOf<Contact[]>();

      return {
        city: state.values.profile.address.city,
        contactCount: state.values.contacts.length,
      };
    },
    selected => {
      expectTypeOf(selected).toEqualTypeOf<{
        city: string;
        contactCount: number;
      }>();
    },
  );
});
