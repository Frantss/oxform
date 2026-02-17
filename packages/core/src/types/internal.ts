import type { PersistedFields } from '#utils/fields';

export type PersistedFormStatus = {
  submits: number;
  submitting: boolean;
  validating: boolean;
  successful: boolean;
  dirty: boolean;
};

export type PersistedFieldMeta = {
  blurred: boolean;
  touched: boolean;
  dirty: boolean;
};

export type Fields<Issue = unknown> = Record<
  string,
  {
    id: string;
    meta: {
      blurred: boolean;
      touched: boolean;
      dirty: boolean;
      default: boolean;
      valid: boolean;
      pristine: boolean;
    };
    errors: Issue[];
    ref: HTMLElement | null;
  }
>;

export type FormBaseStore<Values> = {
  values: Values;
  fields: PersistedFields;
  status: PersistedFormStatus;
};
