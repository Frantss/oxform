import type { DeepKeys } from '#more-types';
import type { PartialDeep, Simplify, StandardSchema } from '#types';
import type { PersistedFields } from '#utils/fields';

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

export type Fields = Record<
  string,
  {
    id: string;
    meta: FieldMeta;
    errors: FormIssue[];
    ref: HTMLElement | null;
  }
>;

export type FormBaseStore<Values> = {
  values: Values;
  fields: PersistedFields;
  status: PersistedFormStatus;
};

export type FormStore<Values> = {
  values: Values;
  fields: Fields;
  status: FormStatus;
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
  defaultValues: NoInfer<Values>;
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

export type FieldValidationOptions = {
  should?: {
    /** Whether to validate the field after the event. Defaults to true. */
    validate?: boolean;
  };
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
