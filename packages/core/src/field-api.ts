import type { FormApi } from '#form-api';
import type {
  FieldChangeOptions,
  FieldMeta,
  FormIssue,
  FormResetFieldOptions,
  FormSetErrorsOptions,
  ValidateOptions,
} from '#form-api.types';
import type { DeepKeys, DeepValue } from '#more-types';
import type { StandardSchema } from '#types';
import { get } from '#utils/get';
import type { Updater } from '#utils/update';
import { Derived } from '@tanstack/store';
import { stringToPath } from 'remeda';

export type FieldOptions<
  Schema extends StandardSchema,
  Name extends DeepKeys<StandardSchema.InferInput<Schema>> = DeepKeys<StandardSchema.InferInput<Schema>>,
> = {
  form: FormApi<Schema>;
  name: Name;
};

export type FieldStore<Value> = {
  value: Value;
  defaultValue: Value;
  meta: FieldMeta;
  errors: FormIssue[];
};

export class FieldApi<
  Schema extends StandardSchema,
  Name extends DeepKeys<StandardSchema.InferInput<Schema>>,
  in out Value extends DeepValue<StandardSchema.InferInput<Schema>, Name>,
> {
  private _options: FieldOptions<Schema, Name>;
  private form: FormApi<Schema>;
  private _store: Derived<FieldStore<Value>>;

  constructor(options: FieldOptions<Schema, Name>) {
    this._options = options;
    this.form = options.form;

    this._store = new Derived<FieldStore<Value>>({
      deps: [this.form.store()],
      fn: () => {
        const value = this.form.field.get(this._options.name as never) as Value;
        const defaultValue = get(this.form.options().defaultValues as never, stringToPath(this._options.name)) as Value;
        const meta = this.form.field.meta(this._options.name as never);
        const errors = this.form.field.errors(this._options.name as never);

        return {
          value,
          defaultValue,
          meta,
          errors,
        };
      },
    });
  }

  public '~mount' = () => {
    const unsubscribe = this._store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FieldOptions<Schema, Name>) => {
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
