import type { FieldBlurOptions } from '#types/api/field-blur-options';
import type { FieldChangeOptions } from '#types/api/field-change-options';
import type { FieldExtra } from '#types/api/field-extra';
import type { FieldFocusOptions } from '#types/api/field-focus-options';
import type { FieldOptions } from '#types/api/field-options';
import type { FieldPluginsInput } from '#types/api/field-plugins-input';
import type { FieldStore } from '#types/api/field-store';
import type { FormErrorsOptions } from '#types/api/form-errors-options';
import type { FormIssue } from '#types/api/form-issue';
import type { FormResetFieldOptions } from '#types/api/form-reset-field-options';
import type { FormSetErrorsOptions } from '#types/api/form-set-errors-options';
import type { FormStore } from '#types/api/form-store';
import { fields_fixPath } from '#utils/fields';
import { get } from '#utils/get';
import { Derived } from '@tanstack/store';
import { stringToPath } from 'remeda';

export class FieldApi<Value, Extra extends FieldExtra = {}> {
  public options: FieldOptions<any, any>;
  public store: Derived<FieldStore<Value>>;

  constructor(options: FieldOptions<any, any>) {
    this.options = options;
    this.store = new Derived<FieldStore<Value>>({
      deps: [this.options.form.store],
      fn: ({ currDepVals }) => {
        const form = currDepVals[0]! as FormStore<any>;
        const state = form.fields[fields_fixPath(this.options.name) as never];
        const path = stringToPath(this.options.name as never);
        const value = get(form.values as never, path as never) as Value;
        const defaultValue = get(this.options.form.options.defaultValues as never, path as never) as Value;

        return {
          ...state,
          value,
          defaultValue,
        };
      },
    });
  }

  public get id() {
    return this.store.state.id;
  }

  public get state() {
    return this.store.state;
  }

  public get value() {
    return this.get();
  }

  public get extra() {
    const withOptions = this.options.form.options.with as
      | Record<string, FieldPluginsInput<Value> | undefined>
      | undefined;
    const globalInput = withOptions?.['*'];
    const fieldInput = withOptions?.[this.options.name as string];
    const globalPlugins = globalInput ? (Array.isArray(globalInput) ? globalInput : [globalInput]) : [];
    const fieldPlugins = fieldInput ? (Array.isArray(fieldInput) ? fieldInput : [fieldInput]) : [];
    const plugins = [...globalPlugins, ...fieldPlugins];

    let output: FieldExtra = {};

    for (const plugin of plugins) {
      output = {
        ...output,
        ...plugin(this),
      };
    }

    return output as Extra;
  }

  public '~mount' = () => {
    return this.store.mount();
  };

  public '~update' = (options: FieldOptions<any, any>) => {
    this.options = options;
  };

  public change = (updater: Value | ((current: Value) => Value), options?: FieldChangeOptions) => {
    this.options.form.field.change(this.options.name as never, updater as never, options);
  };

  public focus = (options?: FieldFocusOptions) => {
    this.options.form.field.focus(this.options.name as never, options);
  };

  public blur = (options?: FieldBlurOptions) => {
    this.options.form.field.blur(this.options.name as never, options);
  };

  public get = () => {
    return this.options.form.field.get(this.options.name as never) as Value;
  };

  public register = (element: HTMLElement | null) => {
    return this.options.form.field.register(this.options.name as never)(element);
  };

  public unregister = () => {
    this.options.form.field.unregister(this.options.name as never);
  };

  public errors = (options?: FormErrorsOptions): FormIssue[] => {
    return this.options.form.field.errors(this.options.name as never, options);
  };

  public setErrors = (errors: FormIssue[], options?: FormSetErrorsOptions) => {
    this.options.form.field.setErrors(this.options.name as never, errors, options);
  };

  public reset = (options?: FormResetFieldOptions<Value>) => {
    this.options.form.field.reset(this.options.name as never, options as never);
  };
}
