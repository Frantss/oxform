import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type CheckApi,
  type FormKind,
  type PartSpec,
  type StandardKind,
  configureForm,
  createCheck,
  defineExtension,
  extendForm,
  standardForm,
} from '../api';

type WarningApi<Values> = { readonly warning: CheckApi<Values, 'warning'> };
interface ApiOnlyKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: WarningApi<this['values']>;
  readonly parts: {};
}
interface OptsKind extends FormKind {
  readonly options: { readonly warning?: { readonly blur?: StandardSchemaV1<unknown> } };
  readonly state: {};
  readonly api: {};
  readonly parts: {};
}
interface PartsKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: {};
  readonly parts: { readonly warningText: PartSpec<{ name: string }, { messages: readonly string[] }> };
}

// A: api only
extendForm<StandardKind, ApiOnlyKind>(standardForm, {
  name: 'a',
  api: (ctx, base) => ({
    warning: createCheck(ctx, { values: base.values, validation: base.validation }, { name: 'warning' }),
  }),
});

// B: options only
extendForm<StandardKind, OptsKind>(standardForm, { name: 'b', options: { warning: 'value' }, api: () => ({}) });

// C: parts only
extendForm<StandardKind, PartsKind>(standardForm, {
  name: 'c',
  api: () => ({}),
  slots: slot => ({ warningText: slot({ props: { name: 'key' }, state: () => ({ messages: ['x'] }) }) }),
});

// D: a kind states only what it adds. Members left out are `unknown`, which an intersection ignores.
interface OnlyOptionsKind extends FormKind {
  readonly options: { readonly note?: string };
}
const withNote = defineExtension<{}, OnlyOptionsKind>({ name: 'note', options: { note: 'string' }, api: () => ({}) });
const noteSchema = {} as StandardSchemaV1<{ a: string }>;
const noted = configureForm(withNote(standardForm), { schema: noteSchema, defaultValues: { a: '' }, note: 'x' });
noted().values.get().a satisfies string;
// @ts-expect-error `note` is a string
configureForm(withNote(standardForm), { schema: noteSchema, defaultValues: { a: '' }, note: 1 });
