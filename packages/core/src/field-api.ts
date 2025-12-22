import { type AnyFormApi, type FormFields, type FormFieldValue } from '#form-api';
import type {
  FieldChangeOptions,
  FieldMeta,
  FormIssue,
  FormResetFieldOptions,
  FormSetErrorsOptions,
  ValidateOptions,
} from '#form-api.types';
import { get } from '#utils/get';
import type { Updater } from '#utils/update';
import { Derived } from '@tanstack/store';
import { isDeepEqual, stringToPath } from 'remeda';

export type FieldOptions<Form extends AnyFormApi, Name extends FormFields<Form>> = {
  form: Form;
  name: Name;
};

export type FieldState<Value> = {
  value: Value;
  defaultValue: Value;
  meta: FieldMeta;
  errors: FormIssue[];
};

export type AnyFieldApi = FieldApi<any>;

export class FieldApi<Value> {
  private _options: FieldOptions<AnyFormApi, string>;
  private form: AnyFormApi;
  private _store: Derived<FieldState<Value>>;

  constructor(options: FieldOptions<AnyFormApi, string>) {
    this._options = options;
    this.form = options.form;

    this._store = new Derived<FieldState<Value>>({
      deps: [this.form.store()],
      fn: ({ prevVal }) => {
        const previous = prevVal as FieldState<Value> | undefined;

        const value = this.form.field.get(this._options.name as never) as Value;
        const defaultValue = get(this.form.options().defaultValues as never, stringToPath(this._options.name)) as Value;
        const meta = this.form.field.meta(this._options.name as never);
        const errors = this.form.field.errors(this._options.name as never);

        const updated = {
          value,
          defaultValue,
          meta,
          errors,
        };

        if (previous && isDeepEqual(previous, updated)) return previous;

        return updated;
      },
    });
  }

  public '~mount' = () => {
    const unsubscribe = this._store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FieldOptions<AnyFormApi, string>) => {
    // ref: https://github.com/TanStack/form/blob/main/packages/form-core/src/FieldApi.ts#L1300
    this._options = options;
  };

  public options = () => {
    return this._options;
  };

  public store = () => {
    return this._store;
  };

  public state = () => {
    return this._store.state;
  };

  public focus = () => {
    return this.form.field.focus(this._options.name);
  };

  public blur = () => {
    return this.form.field.blur(this._options.name);
  };

  /**
   * Changes the value of this field with optional control over side effects.
   * @param value - The new value to set for the field
   * @param options - Optional configuration for controlling validation, dirty state, and touched state
   */
  public change = (value: Updater<Value>, options?: FieldChangeOptions) => {
    return this.form.field.change(this._options.name, value as never, options);
  };

  public register = () => this.form.field.register(this._options.name);

  /**
   * Validates this specific field using the specified validation type.
   * @param options - Optional validation options specifying the validation type ('change' | 'submit' | 'blur' | 'focus')
   * @returns Promise resolving to an array of validation issues for this field
   */
  public validate = (options?: ValidateOptions) => {
    return this.form.validate(this._options.name, options);
  };

  /**
   * Resets this field to its default value and optionally resets metadata and errors.
   * @param options - Reset options for controlling what gets reset and what gets kept
   */
  public reset = (options?: FormResetFieldOptions<Value>) => {
    return this.form.field.reset(this._options.name, options);
  };

  /**
   * Sets validation errors for this specific field.
   * @param errors - Array of validation errors to set
   * @param mode - How to handle existing errors: 'replace' (default), 'append', or 'keep'
   */
  public setErrors = (errors: FormIssue[], options?: FormSetErrorsOptions) => {
    return this.form.field.setErrors(this._options.name, errors, options);
  };
}

export const createFieldApi = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
) => {
  type Value = FormFieldValue<Form, Name>;

  return new FieldApi(options) as FieldApi<Value>;
};

// const schema = z.object({ name: z.string(), nested: z.object({ deep: z.object({ deeper: z.string().array() }) }) });
// const form = new FormApi({ schema });
// const field = createFieldApi({ form, name: 'name' });
