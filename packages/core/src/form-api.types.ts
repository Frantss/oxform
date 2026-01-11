import type { FormApi } from '#form-api';
import type { DeepKeys } from '#more-types';
import type { PartialDeep, Simplify, StandardSchema } from '#types';

export type PersistedFormStatus = {
  submits: number;
  submitting: boolean;
  validating: boolean;
  successful: boolean;
  dirty: boolean;
};

export type FormStatus = Simplify<
  PersistedFormStatus & {
    submitted: boolean;
    valid: boolean;
  }
>;

export type PersistedFieldMeta = {
  blurred: boolean;
  touched: boolean;
  dirty: boolean;
};

export type FieldMeta = Simplify<
  PersistedFieldMeta & {
    default: boolean;
    valid: boolean;
    pristine: boolean;
  }
>;

export type FormBaseStore<Values> = {
  values: Values;
  fields: Record<string, PersistedFieldMeta>;
  refs: Record<string, HTMLElement | null>;
  status: PersistedFormStatus;
  errors: Record<string, FormIssue[]>;
};

export type FormStore<Values> = {
  values: Values;
  fields: Record<string, FieldMeta>;
  refs: Record<string, HTMLElement | null>;
  status: FormStatus;
  errors: Record<string, FormIssue[]>;
};

export type FieldControl<Value> = {
  focus: () => void;
  blur: () => void;
  change: (value: Value) => void;
  register: (element: HTMLElement | null) => void;
};

type FormValidatorSchema<Values> = StandardSchema<PartialDeep<Values>>;
type FormValidatorFunction<Values> = (store: FormStore<Values>) => FormValidatorSchema<Values>;
type FormValidator<Values> = FormValidatorSchema<Values> | FormValidatorFunction<Values>;

export type FormOptions<Values> = {
  schema: StandardSchema<Values>;
  values?: Values;
  defaultValues: Values;
  validate?: {
    change?: FormValidator<Values>;
    submit?: FormValidator<Values>;
    blur?: FormValidator<Values>;
    focus?: FormValidator<Values>;
  };
  related?: Record<DeepKeys<Values>, DeepKeys<Values>[]>;
};

export type FormIssue = StandardSchema.Issue;

export type ValidationType = 'change' | 'submit' | 'blur' | 'focus';

export type ValidateOptions = {
  type?: ValidationType;
};

export type FieldChangeOptions = {
  should?: {
    /** Whether to validate the field after changing its value. Defaults to true. */
    validate?: boolean;
    /** Whether to mark the field as dirty after changing its value. Defaults to true. */
    dirty?: boolean;
    /** Whether to mark the field as touched after changing its value. Defaults to true. */
    touch?: boolean;
  };
};

export type FieldResetMeta = {
  blurred?: boolean;
  touched?: boolean;
  dirty?: boolean;
};

export type FieldResetKeepOptions = {
  errors?: boolean;
  refs?: boolean;
  meta?: boolean;
};

export type FormResetFieldOptions<Value> = {
  value?: Value;
  meta?: FieldResetMeta;
  keep?: FieldResetKeepOptions;
};

export type FormResetKeepOptions = {
  /** Keep current field errors */
  errors?: boolean;
  /** Keep current references to html input elements */
  refs?: boolean;
  /** Keep current field metadata */
  fields?: boolean;
};

export type FormResetOptions<Values> = {
  values?: Values;
  status?: Partial<PersistedFormStatus>;
  keep?: FormResetKeepOptions;
};

export type FieldSetErrorsMode = 'replace' | 'append' | 'keep';

export type FormSetErrorsOptions = {
  mode?: FieldSetErrorsMode;
};

export type FormErrorsOptions = {
  nested?: boolean;
};

export type FormSubmitSuccessHandler<Schema extends StandardSchema> = (
  data: StandardSchema.InferOutput<Schema>,
  form: FormApi<Schema>,
) => void | Promise<void>;

export type FormSubmitErrorHandler<Schema extends StandardSchema> = (
  issues: FormIssue[],
  form: FormApi<Schema>,
) => void | Promise<void>;

export type FormSubmitHandlers<Schema extends StandardSchema> = {
  onSuccess: FormSubmitSuccessHandler<Schema>;
  onError?: FormSubmitErrorHandler<Schema>;
};
