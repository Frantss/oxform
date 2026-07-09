import {
  useArrayField,
  useField,
  useFieldApi,
  useForm,
  useFormEffect,
  useFormStatus,
  useSubscribe,
  type FormIssuesByLevel,
  type FormStatus,
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

const useTypedForm = () =>
  useForm({
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

it('covers direct React hook schema inference contracts', () => {
  const Component = () => {
    const form = useTypedForm();
    const name = useField({ form, name: 'name' });
    const city = useFieldApi({ form, name: 'profile.address.city' });
    const contacts = useArrayField({ form, name: 'contacts' });
    const tags = useArrayField({ form, name: 'tags' });
    const status = useFormStatus({ form });
    const selectedCity = useSubscribe(form, state => {
      expectTypeOf(state.values.profile.address.city).toEqualTypeOf<string>();
      return state.values.profile.address.city;
    });

    useFormEffect(
      form,
      state => {
        expectTypeOf(state.values.contacts).toEqualTypeOf<Contact[]>();

        return {
          contactCount: state.values.contacts.length,
          tagCount: state.values.tags.length,
        };
      },
      selected => {
        expectTypeOf(selected).toEqualTypeOf<{
          contactCount: number;
          tagCount: number;
        }>();
      },
    );

    expectTypeOf(form.values).toEqualTypeOf<Values>();
    expectTypeOf(form.field.get('contacts.0.phones.0.number')).toEqualTypeOf<string | undefined>();
    expectTypeOf(name.state.value).toEqualTypeOf<string>();
    expectTypeOf(name.state.defaultValue).toEqualTypeOf<string>();
    expectTypeOf(name.props.value).toEqualTypeOf<string>();
    expectTypeOf(name.state.issues).toEqualTypeOf<FormIssuesByLevel<IssueLevels>>();
    expectTypeOf(city.state.value).toEqualTypeOf<string>();
    expectTypeOf(contacts.state.value).toEqualTypeOf<Contact[]>();
    expectTypeOf(tags.state.value).toEqualTypeOf<string[]>();
    expectTypeOf(status).toEqualTypeOf<FormStatus<IssueLevels>>();
    expectTypeOf(selectedCity).toEqualTypeOf<string>();

    name.change(current => {
      expectTypeOf(current).toEqualTypeOf<string>();
      return current.toUpperCase();
    });
    contacts.append({
      email: 'grace@example.com',
      phones: [{ number: '555-0101' }],
    });
    contacts.update(0, current => {
      expectTypeOf(current).toEqualTypeOf<Contact>();
      return current;
    });
    tags.append(current => {
      expectTypeOf(current).toEqualTypeOf<string>();
      return current.toUpperCase();
    });

    // @ts-expect-error field hook names must come from the form schema.
    useField({ form, name: 'profile.missing' });

    // @ts-expect-error field API hook names must come from the form schema.
    useFieldApi({ form, name: 'profile.missing' });

    // @ts-expect-error array field hook names must be array-valued schema paths.
    useArrayField({ form, name: 'name' });

    // @ts-expect-error field writes must match the selected field value.
    name.change(123);

    // @ts-expect-error array items must match the selected array item type.
    contacts.append({ email: 'missing-phones@example.com' });

    return null;
  };

  expect(Component).toBeDefined();
});

it('rejects invalid useForm configuration from the schema contract', () => {
  const Component = () => {
    useForm({
      schema,
      defaultValues: {
        ...defaultValues,
        // @ts-expect-error defaultValues must match the schema output type.
        age: '36',
      },
    });

    return null;
  };

  expect(Component).toBeDefined();
});
