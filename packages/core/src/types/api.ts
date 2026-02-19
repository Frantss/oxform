import type { FormApi } from '#form/form-api';
import type { DeepKeys, DeepValue } from '#types/deep';
import type { AnyFormApi, FormArrayFields, FormFields } from '#types/form';
import type { Fields as InternalFields, PersistedFieldMeta, PersistedFormStatus } from '#types/internal';
import type { ArrayLike, PartialDeep, Simplify, StandardSchema } from '#types/misc';

export type FormStatus = Simplify<
  PersistedFormStatus & {
    submitted: boolean;
    valid: boolean;
  }
>;

export type FieldMeta = Simplify<
  PersistedFieldMeta & {
    default: boolean;
    valid: boolean;
    pristine: boolean;
  }
>;

export type FormStore<Values> = {
  values: Values;
  fields: InternalFields<FormIssue>;
  status: FormStatus;
};

type FormValidatorSchema<Values> = StandardSchema<PartialDeep<Values>>;
type FormValidatorFunction<Values> = (store: FormStore<Values>) => FormValidatorSchema<Values>;
type FormValidator<Values> = FormValidatorSchema<Values> | FormValidatorFunction<Values>;

export type FieldExtra = Record<string, unknown>;

export type FieldPlugin<Value, Extra extends FieldExtra> = (field: {
  value: Value;
  state: FieldStore<Value>;
  options: {
    form: AnyFormApi;
    name: string;
  };
}) => Extra;

export type FieldPluginsInput<Value> = FieldPlugin<Value, any> | readonly FieldPlugin<Value, any>[];

export type FormWithOptions<Values> = Partial<
  {
    '*': FieldPluginsInput<any>;
  } & {
    [Name in DeepKeys<Values>]: FieldPluginsInput<DeepValue<Values, Name>>;
  }
>;

export type FormOptions<Values, With extends FormWithOptions<Values> = FormWithOptions<Values>> = {
  schema: StandardSchema<Values>;
  defaultValues: NoInfer<Values>;
  validate?: {
    change?: FormValidator<Values>;
    submit?: FormValidator<Values>;
    blur?: FormValidator<Values>;
    focus?: FormValidator<Values>;
  };
  related?: Record<DeepKeys<Values>, DeepKeys<Values>[]>;
  with?: With;
};

export type FormIssue = StandardSchema.Issue;

export type ValidationType = 'change' | 'submit' | 'blur' | 'focus';

export type ValidateOptions = {
  type?: ValidationType;
};

export type FormSubmitSuccessHandler<Values> = (values: Values, form: FormApi<Values, any>) => void | Promise<void>;

export type FormSubmitErrorHandler<Values> = (issues: FormIssue[], form: FormApi<Values, any>) => void | Promise<void>;

export type FieldFocusOptions = {
  should?: {
    /** Whether to validate the field after focusing. Defaults to true only when a focus validator is configured. */
    validate?: boolean;
  };
};

export type FieldBlurOptions = {
  should?: {
    /** Whether to validate the field after blurring. Defaults to true only when a blur validator is configured. */
    validate?: boolean;
  };
};

export type FieldChangeOptions = {
  should?: {
    /** Whether to validate the field after changing its value. Defaults to true only when a change validator is configured. */
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

export type FieldState = {
  id: string;
  meta: FieldMeta;
  errors: FormIssue[];
  ref: HTMLElement | null;
};

export type FieldStore<Value> = {
  value: Value;
  defaultValue: Value;
} & FieldState;

export type FieldOptions<Form extends AnyFormApi, Name extends FormFields<Form>> = {
  form: Form;
  name: Name;
};

export type ArrayFieldStore<Value extends ArrayLike> = {
  value: Value;
  defaultValue: Value;
};

export type ArrayFieldOptions<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = {
  form: Form;
  name: Name;
};
