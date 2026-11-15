import type { StandardSchemaV1 } from '@standard-schema/spec';
import { warnings } from '../kit/warnings';
import { createParts, defineExtension, defineForm, usePart, type Extendable, type Needs } from '../spike/src/api';
import { standard } from '../spike/src/standard';

type Signup = {
  name: string;
  email: string;
  tags: string[];
  members: { name: string; role: string }[];
  card: { number: string };
};
declare const schema: StandardSchemaV1<Signup>;
const defaultValues: Signup = { name: '', email: '', tags: [], members: [], card: { number: '' } };
const base = defineForm({ schema, defaultValues }).extend(standard);
type IsAny<T> = 0 extends 1 & T ? true : false;

// 1. `defineForm` infers Values from schema; options are checked against it
export const signup = base.configure({
  error: { change: schema, blur: () => schema },
  onSubmit: async values => {
    values.email.toUpperCase();
  },
  onInvalid: issues => {
    issues.error.map(entry => entry.message);
  },
});

// @ts-expect-error wrong default value shape
defineForm({ schema, defaultValues: { ...defaultValues, name: 1 } });
// @ts-expect-error unknown option
base.configure({ nope: true });
// @ts-expect-error callback sees typed values
base.configure({ onSubmit: values => values.nope });

// 2. instance api is typed by Values
const form = signup.create();
form.field('email').change('x');
form.field('card.number').get().toUpperCase();
form
  .field('email')
  .error()
  .map(entry => entry.message);
form.field('email').setError([{ message: 'x' }], { mode: 'append' });
// @ts-expect-error unknown path
form.field('nope');
// @ts-expect-error wrong value type
form.field('name').change(1);
form.error.at('email');
form.values.get('card.number').toUpperCase();
form.status.at('name').dirty;
form.reset.all({ keep: { checks: ['error'], refs: true } });
form.array('members').append({ name: '', role: 'm' });
// @ts-expect-error wrong item type
form.array('members').append({ name: 1 });
// @ts-expect-error not an array path
form.array('name');
form.arrays.move('tags', 0, 1);
const [valid, issues] = await form.validation.run('card', { type: 'blur' });
issues.error.length;
// KNOWN GAP (track B decision): `validation.run` returns `IssuesByCheck<string>`, so the names of the checks are not
// tracked and `issues.warning` compiles on a form with no `warning` check. When the names are tracked, this line fails:
// replace it with `// @ts-expect-error only the error check exists in the standard form`.
issues.warning satisfies readonly unknown[];
form.store.state.error;
form.store.state.status.form.submitting;

// 3. An extension adds a check, an option, state and a part, typed by Values, and keeps the base api
const order = base.extend(warnings).configure({ warning: { blur: schema } });
const orderForm = order.create();
orderForm.warning.at('email');
orderForm.error.at('email'); // base api is kept
// @ts-expect-error path typed on the extension
orderForm.warning.at('nope');
// @ts-expect-error the standard form has no warning
form.warning;
// @ts-expect-error the option belongs to the extension
base.configure({ warning: { blur: schema } });

// 4. An api-only extension: the additions are inferred
const draftState = <Values,>(form: Extendable<Values, Needs<Values, 'values'>>) =>
  defineExtension(form, {
    name: 'draft',
    api: (_ctx, { values }) => ({ draft: { flush: () => values.get() } }),
  });
const draft = base.extend(draftState).create();
draft.draft.flush();
draft.field('email');
// @ts-expect-error base paths stay typed after a plain extension
draft.field('nope');

// 5. parts: elements per slot, typed names, state in children, Root takes options as props
export const { Root, Field, FieldError, Submit, Reset, useForm, useSelector, useField, useArrayField } = createParts(
  signup,
  {
    root: 'form',
    field: 'input',
    fieldError: 'p',
    submit: 'button',
    reset: 'button',
  },
);

export const view = (
  <Root onSubmit={values => values.name.toUpperCase()} onInvalid={issues => issues.error.length} className='x'>
    <Field name='name' placeholder='Name' />
    <Field name='card.number' />
    {/* @ts-expect-error field names are typed */}
    <Field name='nope' />
    <FieldError name='email'>{({ messages }) => messages[0]}</FieldError>
    <Submit>{({ submitting, submits }) => (submitting ? 'Saving' : String(submits))}</Submit>
    <Reset>Reset</Reset>
  </Root>
);

// The element's own props, a typed `ref`, and `render` with the state of the part
export const rendered = (
  <Root>
    <Field name='name' ref={(element: HTMLInputElement | null) => element?.focus()} render={<textarea />} />
    <FieldError name='email' render={(props, { messages }) => <span {...props}>{messages[0]}</span>} />
    {/* @ts-expect-error the ref is the part's element: an input */}
    <Field name='name' ref={(element: HTMLButtonElement | null) => element?.focus()} />
    {/* KNOWN GAP (slot typing): the state of a part is `any`, because a slot's `state` return type is not carried into
        `PartSpec`. When it is typed, `anyState = true` fails: restore `state.nope` with a `@ts-expect-error`. */}
    <FieldError
      name='email'
      render={(props, state) => {
        const anyState: IsAny<typeof state> = true;
        return <span {...props}>{String(anyState)}</span>;
      }}
    />
  </Root>
);

// Each part renders in the element its slot declares. The element map only overrides.
const defaults = createParts(signup);
export const defaulted = (
  <defaults.Root>
    <defaults.Field name='name' ref={(element: HTMLInputElement | null) => element?.focus()} />
    <defaults.FieldError name='email'>{({ messages }) => messages[0]}</defaults.FieldError>
    {/* @ts-expect-error the default element of a field is an input */}
    <defaults.Field name='name' ref={(element: HTMLButtonElement | null) => element?.focus()} />
  </defaults.Root>
);
const overridden = createParts(signup, { field: 'textarea' });
export const textarea = (
  <overridden.Field name='name' ref={(element: HTMLTextAreaElement | null) => element?.focus()} />
);

export function Inner() {
  const hooked = useForm();
  const dirty = useSelector(state => state.status.form.dirty);
  const email = useField('email');
  const members = useArrayField('members');
  members.append({ name: '', role: '' });
  // @ts-expect-error hook names are typed
  useField('nope');
  return usePart(signup, 'field', { name: 'name' }, { className: 'x' }, 'select');
}
