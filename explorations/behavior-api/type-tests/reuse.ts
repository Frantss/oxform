import {
  type ExtendedKind,
  type FormDefinition,
  type FormKind,
  type StandardKind,
  type ApiOf,
  type ValidationApi,
  type ValuesApi,
  type CheckApi,
  standardForm,
} from '../api';

// A reusable extension states what it needs from a base, not which base it is.
type Needs = { readonly values: ValuesApi<any>; readonly validation: ValidationApi<any> };
type Requires<Base extends FormKind> = ApiOf<Base, any> extends Needs ? unknown : never;

type AutosaveApi<Values> = { readonly autosave: { flush(): Values } };
type AutosaveOptions<Values> = { readonly saveDraft?: (draft: Values) => unknown };
interface AutosaveKind extends FormKind {
  readonly options: AutosaveOptions<this['values']>;
  readonly state: { readonly autosave: { saving: boolean } };
  readonly api: AutosaveApi<this['values']>;
  readonly parts: {};
}
declare function withAutosave<Base extends FormKind>(
  def: FormDefinition<Base> & Requires<Base>,
): FormDefinition<ExtendedKind<Base, AutosaveKind>>;

// Base 1: the preset
withAutosave(standardForm);

// Base 2: a lean kind with values and validation only
type LeanApi<Values> = { readonly values: ValuesApi<Values>; readonly validation: ValidationApi<Values, 'error'> };
interface LeanKind extends FormKind {
  readonly options: { readonly schema: unknown };
  readonly state: {};
  readonly api: LeanApi<this['values']>;
  readonly parts: {};
}
declare const lean: FormDefinition<LeanKind>;
withAutosave(lean);

// Base 3: no validation behavior. The requirement must reject it.
type BareApi<Values> = { readonly values: ValuesApi<Values> };
interface BareKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: BareApi<this['values']>;
  readonly parts: {};
}
declare const bare: FormDefinition<BareKind>;
// @ts-expect-error missing validation
withAutosave(bare);

// Chaining two reusable extensions keeps both apis
type WarnApi<Values> = { readonly warning: CheckApi<Values, 'warning'> };
interface WarnKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: WarnApi<this['values']>;
  readonly parts: {};
}
declare function withWarning<Base extends FormKind>(
  def: FormDefinition<Base> & Requires<Base>,
): FormDefinition<ExtendedKind<Base, WarnKind>>;
export const both = withWarning(withAutosave(standardForm));
export type BothApi = ApiOf<typeof both extends FormDefinition<infer K> ? K : never, { a: string }>;
declare const probe: BothApi;
probe.autosave.flush().a.toUpperCase();
probe.warning.at('a');
// @ts-expect-error path typed through the chain
probe.warning.at('nope');
probe.field('a');
