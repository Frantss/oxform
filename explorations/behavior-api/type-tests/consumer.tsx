import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type CheckApi,
  type FormKind,
  type PartSpec,
  type StandardKind,
  type ValidationApi,
  configureForm,
  createCheck,
  createParts,
  extendForm,
  standardForm,
  usePart,
} from '../api';

type Signup = {
  name: string;
  email: string;
  tags: string[];
  members: { name: string; role: string }[];
  card: { number: string };
};
declare const schema: StandardSchemaV1<Signup>;
const defaultValues: Signup = { name: '', email: '', tags: [], members: [], card: { number: '' } };

// 1. configureForm infers Values from schema; options are checked against it
export const signup = configureForm(standardForm, {
  schema,
  defaultValues,
  error: { change: schema, blur: store => schema },
  onSubmit: async values => {
    values.email.toUpperCase();
  },
  onInvalid: issues => {
    issues.error.map(entry => entry.message);
  },
});

// @ts-expect-error wrong default value shape
configureForm(standardForm, { schema, defaultValues: { ...defaultValues, name: 1 } });
// @ts-expect-error unknown option
configureForm(standardForm, { schema, defaultValues, nope: true });
// @ts-expect-error callback sees typed values
configureForm(standardForm, { schema, defaultValues, onSubmit: values => values.nope });

// 2. instance api is typed by Values
const form = signup();
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
// @ts-expect-error only the error check exists in the standard form
issues.warning;
form.store.state.error;
form.store.state.status.form.submitting;

// 3. extendForm with an explicit kind: options, state, api and parts that depend on Values
type WarningApi<Values> = { readonly warning: CheckApi<Values, 'warning'> };
interface WarningKind extends FormKind {
  readonly options: { readonly warning?: { readonly blur?: StandardSchemaV1<unknown> } };
  readonly state: { readonly warning: Readonly<Record<string, readonly { message: string }[]>> };
  readonly api: WarningApi<this['values']>;
  readonly parts: { readonly warningText: PartSpec<{ name: string }, { messages: readonly string[] }> };
}

const withWarning = extendForm<StandardKind, WarningKind>(standardForm, {
  name: 'warning-form',
  options: { warning: 'value' },
  api: (ctx, base) => ({
    warning: createCheck(ctx, { values: base.values, validation: base.validation }, { name: 'warning' }),
  }),
  slots: slot => ({
    warningText: slot({
      props: { name: 'key' },
      state: state => ({ messages: (state.warning['x'] ?? []).map(entry => entry.message) }),
    }),
  }),
});

const order = configureForm(withWarning, { schema, defaultValues, warning: { blur: schema } });
const orderForm = order();
orderForm.warning.at('email');
orderForm.error.at('email'); // base api is kept
// @ts-expect-error path typed on the extension
orderForm.warning.at('nope');
// @ts-expect-error the standard form has no warning
signup().warning;

// 4. api-only extension: additions are inferred
const withAutosave = extendForm(standardForm, {
  name: 'autosave-form',
  api: (_ctx, base) => ({ autosave: { flush: () => base.values.get() } }),
});
const draft = configureForm(withAutosave, { schema, defaultValues })();
draft.autosave.flush();
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

// A part omitted from the element map has no component
const partial = createParts(signup, { root: 'form', field: 'input' });
partial.Field;
// @ts-expect-error submit was not mapped
partial.Submit;

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
