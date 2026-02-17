import type { FormCore } from '#form/form-core';
import type { FormCoreFields } from '#form/form-core-fields';
import type {
  FieldBlurOptions,
  FieldChangeOptions,
  FieldFocusOptions,
  FormErrorsOptions,
  FormIssue,
  FormResetFieldOptions,
  FormSetErrorsOptions,
} from '#types/api';
import type { DeepKeys, DeepValue } from '#types/deep';
import { fields_fixPath } from '#utils/fields';
import { get } from '#utils/get';
import { type Updater } from '#utils/update';
import { batch } from '@tanstack/store';
import { setPath, stringToPath } from 'remeda';

export class FormCoreField<Values> {
  private core: FormCore<Values>;
  private fields: FormCoreFields<Values>;

  constructor({ core, fields }: { core: FormCore<Values>; fields: FormCoreFields<Values> }) {
    this.core = core;
    this.fields = fields;
  }

  public change = <const Name extends DeepKeys<Values>>(
    name: Name,
    updater: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const shouldDirty = options?.should?.dirty !== false;
    const shouldTouch = options?.should?.touch !== false;
    const shouldValidate = options?.should?.validate !== false;

    this.core.set(name, updater);

    if (shouldValidate) void this.core.validate(name, { type: 'change' });

    this.fields.set(name, {
      meta: {
        touched: shouldTouch ? true : undefined,
        dirty: shouldDirty ? true : undefined,
      },
    });
  };

  public focus = <const Name extends DeepKeys<Values>>(name: Name, options?: FieldFocusOptions) => {
    const shouldValidate = options?.should?.validate !== false;
    const field = this.fields.get(name);

    if (field.ref) field.ref.focus();

    this.fields.set(name as never, { meta: { touched: true } });
    if (shouldValidate) void this.core.validate(name as never, { type: 'focus' });
  };

  public blur = <const Name extends DeepKeys<Values>>(name: Name, options?: FieldBlurOptions) => {
    const shouldValidate = options?.should?.validate !== false;
    const field = this.fields.get(name);

    if (field.ref) field.ref.blur();

    this.fields.set(name as never, { meta: { blurred: true } });
    if (shouldValidate) void this.core.validate(name as never, { type: 'blur' });
  };

  public get = <const Name extends DeepKeys<Values>>(name: Name) => {
    return get(this.core.store.state.values as never, stringToPath(name)) as DeepValue<Values, Name>;
  };

  public meta = <const Name extends DeepKeys<Values>>(name: Name) => {
    return this.core.store.state.fields[fields_fixPath(name)].meta;
  };

  public register = <const Name extends DeepKeys<Values>>(name: Name) => {
    return (element: HTMLElement | null) => {
      if (!element) return;
      this.fields.set(name, { ref: element });
    };
  };

  public unregister = <const Name extends DeepKeys<Values>>(name: Name) => {
    this.fields.set(name, { ref: null });
  };

  public errors = <const Name extends DeepKeys<Values>>(name: Name, options?: FormErrorsOptions): FormIssue[] => {
    const path = fields_fixPath(name);
    const field = this.core.store.state.fields[path];
    if (!options?.nested) return field.errors;

    const all = Object.keys(this.core.store.state.fields);
    const nested = all.filter(key => key.startsWith(path));

    return nested.reduce((acc, curr) => {
      const sub = this.errors(curr as never);
      return [...acc, ...sub];
    }, [] as FormIssue[]);
  };

  public setErrors = <const Name extends DeepKeys<Values>>(
    name: Name,
    errors: FormIssue[],
    options?: FormSetErrorsOptions,
  ) => {
    const path = fields_fixPath(name);
    const existing = this.core.persisted.state.fields[path].errors;
    let updated: FormIssue[];

    switch (options?.mode) {
      case 'append':
        updated = [...existing, ...errors];
        break;
      case 'keep':
        updated = existing.length > 0 ? existing : errors;
        break;
      case 'replace':
      default:
        updated = errors;
        break;
    }

    this.fields.set(name, { errors: updated });
  };

  public reset = <const Name extends DeepKeys<Values>>(
    name: Name,
    options?: FormResetFieldOptions<DeepValue<Values, Name>>,
  ) => {
    const path = stringToPath(name as never);
    const defaultValue = get(this.core.options.defaultValues, path) as DeepValue<Values, Name>;
    const value = options?.value ?? defaultValue;

    batch(() => {
      this.fields.reset(name);
      this.core.persisted.setState(state => {
        return {
          ...state,
          values: setPath(state.values as never, path as never, value as never),
        };
      });
    });
  };
}
