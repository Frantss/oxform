import {
  ArrayField,
  Field,
  Subscribe,
  createArrayField,
  createField,
  createFieldApi,
  createForm,
  createFormEffect,
  createFormStatus,
  createSubscribe,
  type FormIssuesByLevel,
} from '@oxform/solid/v2';
import { createSignal } from 'solid-js';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  profile: z.object({ enabled: z.boolean(), city: z.string() }),
  contacts: z.object({ email: z.string() }).array(),
  tags: z.string().array().optional(),
});
const defaultValues = { name: 'Ada', age: 36, profile: { enabled: true, city: 'London' }, contacts: [{ email: '' }] };
const typedForm = () => createForm({ schema, defaultValues, checks: { warning: { validate: { change: schema } }, risk: { blocking: true } } });

it('should preserve schema, nested path, optional array and issue-level inference', () => {
  const Component = () => {
    const form = typedForm();
    const field = createField({ form, name: 'name' });
    const city = createFieldApi({ form, name: 'profile.city' });
    const array = createArrayField({ form, name: 'contacts' });
    const tags = createArrayField({ form, name: 'tags' });
    expectTypeOf(form.values).toEqualTypeOf<z.infer<typeof schema>>();
    expectTypeOf(field.value).toEqualTypeOf<string>();
    expectTypeOf(field.props.value).toEqualTypeOf<string>();
    expectTypeOf(city.get()).toEqualTypeOf<string>();
    expectTypeOf(array.state.value).toEqualTypeOf<{ email: string }[]>();
    expectTypeOf(tags.state.value).toEqualTypeOf<string[] | undefined>();
    expectTypeOf(field.state.issues).toEqualTypeOf<FormIssuesByLevel<'error' | 'warning' | 'risk'>>();
    expectTypeOf(createFormStatus({ form }).valid).toEqualTypeOf<boolean>();
    const selected = createSubscribe(form, state => state.values.age);
    expectTypeOf(selected()).toEqualTypeOf<number>();
    createFormEffect(
      form,
      state => state.values.age,
      age => {
        expectTypeOf(age).toEqualTypeOf<number>();
      },
    );
    field.change(current => {
      expectTypeOf(current).toEqualTypeOf<string>();
      return current.toUpperCase();
    });
    array.append({ email: 'ada@example.com' });
    array.update(0, current => {
      expectTypeOf(current).toEqualTypeOf<{ email: string }>();
      return current;
    });
    // @ts-expect-error field names must be schema paths.
    createField({ form, name: 'missing' });
    // @ts-expect-error array names must select array values.
    createArrayField({ form, name: 'age' });
    // @ts-expect-error field writes must match the selected value.
    field.change(123);
    // @ts-expect-error array items must match the schema.
    array.append('wrong');
    // @ts-expect-error defaults must match schema values.
    createForm({ schema, defaultValues: { ...defaultValues, age: '36' } });
    return (
      <>
        <Field form={form} name='name'>
          {name => {
            expectTypeOf(name.value).toEqualTypeOf<string>();
            return <input {...name.props} />;
          }}
        </Field>
        <ArrayField form={form} name='contacts'>
          {contacts => {
            expectTypeOf(contacts.state.value).toEqualTypeOf<{ email: string }[]>();
            return null;
          }}
        </ArrayField>
        <Subscribe api={form} selector={state => state.values.age}>
          {age => {
            expectTypeOf(age()).toEqualTypeOf<number>();
            return <span>{age()}</span>;
          }}
        </Subscribe>
      </>
    );
  };
  expect(Component).toBeDefined();
});

it('should infer accessor options and schema paths without explicit generics', () => {
  const Component = () => {
    const form = createForm(() => ({ schema, defaultValues, checks: { notice: {} } }));
    const [index] = createSignal(0);
    const field = createField(() => ({ form, name: `contacts.${index()}.email` as const }));
    const array = createArrayField(() => ({ form, name: 'contacts' as const }));
    expectTypeOf(field.value).toEqualTypeOf<string | undefined>();
    expectTypeOf(field.state.issues).toEqualTypeOf<FormIssuesByLevel<'error' | 'notice'>>();
    expectTypeOf(array.state.value).toEqualTypeOf<{ email: string }[]>();
    expectTypeOf(form.field.issues('name')).toEqualTypeOf<FormIssuesByLevel<'error' | 'notice'>>();
    // @ts-expect-error accessor paths must be schema paths.
    createField(() => ({ form, name: 'missing' as const }));
    return null;
  };
  expect(Component).toBeDefined();
});
