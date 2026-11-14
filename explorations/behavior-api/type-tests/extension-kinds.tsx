import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type CheckApi,
  type FormKind,
  type PartSpec,
  type StandardKind,
  createCheck,
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
