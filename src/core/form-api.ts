import type { DeepKeys, DeepValue } from '#/core/more-types';
import type { SchemaLike } from '#/core/types';
import { get } from '#/utils/get';
import { validate } from '#/utils/validate';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { batch, Store } from '@tanstack/store';
import { isDeepEqual, isFunction, mergeDeep, setPath, stringToPath } from 'remeda';
import type { PartialDeep } from 'type-fest';

export type FormStatus = {
  submitted: boolean;
  submits: number;
  submitting: boolean;
  valid: boolean;
  validating: boolean;
  dirty: boolean;
  successful: boolean;
};

const defaultStatus = {
  submitted: false,
  submits: 0,
  submitting: false,
  valid: true,
  validating: false,
  dirty: false,
  successful: false,
} satisfies FormStatus;

export type FieldMeta = {
  blurred: boolean;
  touched: boolean;
  dirty: boolean;
  default: boolean;
  valid: boolean;
  pristine: boolean;
};

const defaultMeta = {
  blurred: false,
  touched: false,
  dirty: false,
  pristine: false,
  default: true,
  valid: true,
} satisfies FieldMeta;

type FormStore<Schema extends SchemaLike> = {
  values: StandardSchemaV1.InferInput<Schema>;
  fields: Record<string, FieldMeta>;
  refs: Record<string, HTMLElement | null>;
  status: FormStatus;
  errors: Record<string, StandardSchemaV1.Issue[]>;
};

export type FieldControl<Value> = {
  focus: () => void;
  blur: () => void;
  change: (value: Value) => void;
  register: (element: HTMLElement | null) => void;
};

type FormValidatorSchema<Schema extends SchemaLike> = NoInfer<
  StandardSchemaV1<PartialDeep<StandardSchemaV1.InferInput<Schema>>>
>;
type FormValidatorFunction<Schema extends SchemaLike> = (store: FormStore<Schema>) => FormValidatorSchema<Schema>;
type FormValidator<Schema extends SchemaLike> = FormValidatorSchema<Schema> | FormValidatorFunction<Schema>;

export type FormOptions<Schema extends SchemaLike> = {
  schema: Schema;
  values?: StandardSchemaV1.InferInput<Schema>;
  defaultValues: StandardSchemaV1.InferInput<Schema>;
  validate?: {
    change?: FormValidator<Schema>;
    submit?: FormValidator<Schema>;
    blur?: FormValidator<Schema>;
    focus?: FormValidator<Schema>;
  };
};

export class FormApi<
  Schema extends SchemaLike,
  Values extends StandardSchemaV1.InferInput<Schema> = StandardSchemaV1.InferInput<Schema>,
  Field extends DeepKeys<Values> = DeepKeys<Values>,
> {
  public options!: FormOptions<Schema>;
  public store!: Store<FormStore<Schema>>;

  constructor(options: FormOptions<Schema>) {
    this.options = options;

    this.store = new Store<FormStore<Schema>>({
      values: mergeDeep(options.defaultValues as never, options.values ?? {}),
      fields: {},
      refs: {},
      status: defaultStatus,
      errors: {},
    });
  }

  public '~mount' = () => {
    const unsubscribe = () => {};

    return unsubscribe;
  };

  public '~update' = (options: FormOptions<Schema>) => {
    this.options = options;
  };

  public get status() {
    return this.store.state.status;
  }

  public get values() {
    return this.store.state.values;
  }

  private get validator() {
    const store = this.store.state;
    const validate = this.options.validate;

    return {
      change: isFunction(validate?.change) ? validate.change(store) : validate?.change,
      submit: isFunction(validate?.submit) ? validate.submit(store) : (validate?.submit ?? this.options.schema),
      blur: isFunction(validate?.blur) ? validate.blur(store) : validate?.blur,
      focus: isFunction(validate?.focus) ? validate.focus(store) : validate?.focus,
    };
  }

  public validate = async (field?: Field | Field[], options?: { type: 'change' | 'submit' | 'blur' | 'focus' }) => {
    const validator = options?.type ? this.validator[options.type] : this.options.schema;

    if (!validator) return [];

    const { issues: allIssues } = await validate(validator, this.store.state.values);
    const fields = field ? (Array.isArray(field) ? field : [field]) : undefined;

    const issues = (allIssues ?? []).filter(issue => {
      const path = issue.path?.join('.') ?? 'root';
      return !fields || fields.includes(path as never);
    });

    const errors = issues.reduce((acc, issue) => {
      const path = issue.path?.join('.') ?? 'root';
      return {
        ...acc,
        [path]: [...(acc[path] ?? []), issue],
      };
    }, {} as any);

    this.store.setState(current => {
      // existing errors from non validated fields
      const existing = Object.fromEntries(
        Object.entries(current.errors ?? {}).filter(([key]) => !fields?.includes(key as never)),
      );

      return {
        ...current,
        errors: {
          ...(fields ? existing : {}), // when validating a specific set of fields, keep the existing errors
          ...errors,
        },
      };
    });

    return issues;
  };

  private updateFieldMeta = (
    name: string,
    meta: Partial<Pick<FieldMeta, 'dirty' | 'blurred' | 'touched' | 'valid'>>,
  ) => {
    const defaultValue = get(this.options.defaultValues as never, stringToPath(name));
    const value = this.get(name as never);

    const base = {
      ...defaultMeta,
      ...this.store.state.fields[name],
      ...meta,
    };

    this.store.setState(current => {
      return {
        ...current,
        status: {
          ...current.status,
          dirty: base.dirty,
        },
        fields: {
          ...current.fields,
          [name]: {
            ...base,
            pristine: !base.dirty,
            valid: true, // todo
            default: isDeepEqual(defaultValue, value),
          },
        },
      };
    });
  };

  // private updateStatus = (status: Partial<FormStatus>) => {
  //   this.store.setState(current => {
  //     return {
  //       ...current,
  //       status: {
  //         ...current.status,
  //         ...status,
  //       },
  //     };
  //   });
  // };

  public set = <Name extends Field>(name: Name, value: DeepValue<Values, Name>) => {
    const values = setPath(this.store.state.values as never, stringToPath(name as never) as any, value as never);

    batch(async () => {
      this.store.setState(current => {
        return {
          ...current,
          values,
        };
      });

      await this.validate(name as never, { type: 'change' });
      this.updateFieldMeta(name as never, { dirty: true });
    });
  };

  public focus = <Name extends Field>(name: Name) => {
    const ref = this.store.state.refs[name as never];

    if (ref) ref.focus();

    batch(async () => {
      await this.validate(name as never, { type: 'focus' });
      this.updateFieldMeta(name as never, { touched: true });
    });
  };

  public blur = <Name extends Field>(name: Name) => {
    const ref = this.store.state.refs[name as never];

    if (ref) ref.blur();

    batch(async () => {
      await this.validate(name as never, { type: 'blur' });
      this.updateFieldMeta(name as never, { blurred: true });
    });
  };

  public get = <Name extends Field>(name: Name) => {
    return get(this.store.state.values as never, stringToPath(name as never)) as DeepValue<Values, Name>;
  };

  public meta = <Name extends Field>(name: Name) => {
    return this.store.state.fields[name as never] ?? defaultMeta;
  };

  public register = <Name extends Field>(name: Name) => {
    return (element: HTMLElement | null) => {
      if (!element) return;

      this.store.setState(current => {
        return {
          ...current,
          refs: {
            ...current.refs,
            [name]: element,
          },
        };
      });
    };
  };

  public errors = <Name extends Field>(name: Name) => {
    return this.store.state.errors[name as never] ?? [];
  };

  public submit =
    (
      onSuccess: (data: StandardSchemaV1.InferOutput<Schema>, form: typeof this) => void | Promise<void>,
      onError?: (issues: StandardSchemaV1.Issue[], form: typeof this) => void | Promise<void>,
    ) =>
    async () => {
      this.store.setState(current => {
        return {
          ...current,
          status: {
            ...current.status,
            submitting: true,
            validating: true,
            dirty: true,
          },
        };
      });

      const issues = await this.validate(undefined, { type: 'submit' });
      const valid = issues.length === 0;

      this.store.setState(current => {
        return {
          ...current,
          status: {
            ...current.status,
            validating: false,
            successful: valid,
            valid,
          },
        };
      });

      if (valid) {
        await onSuccess(this.store.state.values as never, this);
      } else {
        await onError?.(issues, this);
      }

      this.store.setState(current => {
        return {
          ...current,
          status: {
            ...current.status,
            submitting: false,
            successful: valid,
            submitted: true,
            submits: current.status.submits + 1,
          },
        };
      });
    };
}
