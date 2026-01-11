import { defaultMeta, defaultStatus } from '#field-api.constants';
import type { FormApi, FormFields } from '#form-api';
import type {
  FieldMeta,
  FormBaseStore,
  FormIssue,
  FormOptions,
  FormStore,
  PersistedFieldMeta,
  PersistedFormStatus,
  ValidateOptions,
} from '#form-api.types';
import { get } from '#utils/get';
import { validate } from '#utils/validate';
import { Derived, Store } from '@tanstack/store';
import { isFunction, mergeDeep, stringToPath } from 'remeda';

export class FormContextApi<Values> {
  public options!: FormOptions<Values>;
  public persisted: Store<FormBaseStore<Values>>;
  public store!: Derived<FormStore<Values>>;

  constructor(options: FormOptions<Values>) {
    const values = mergeDeep(options.defaultValues as never, options.values ?? {}) as Values;

    this.options = options;

    this.persisted = new Store<FormBaseStore<Values>>({
      values,
      fields: {},
      refs: {},
      status: defaultStatus,
      errors: {},
    });

    this.store = new Derived<FormStore<Values>>({
      deps: [this.persisted],
      fn: ({ currDepVals }) => {
        const persisted = currDepVals[0] as FormBaseStore<Values>;

        const invalid = Object.values(persisted.errors).some(issues => issues.length > 0);
        const dirty = Object.values(persisted.fields).some(meta => meta.dirty);
        const fields = Object.fromEntries(
          Object.entries(persisted.fields).map(([key, meta]) => {
            return [key, this.buildFieldMeta(key, meta, persisted.values as Values, persisted.errors)];
          }),
        );

        return {
          ...persisted,
          fields,
          status: {
            ...persisted.status,
            submitted: persisted.status.submits > 0,
            valid: !invalid,
            dirty: persisted.status.dirty || dirty,
          },
        };
      },
    });
  }

  public get status() {
    return this.store.state.status;
  }

  public get values() {
    return this.store.state.values;
  }

  private get validator() {
    const { state } = this.store;
    const validate = this.options.validate;

    return {
      change: isFunction(validate?.change) ? validate.change(state) : validate?.change,
      submit: isFunction(validate?.submit) ? validate.submit(state) : (validate?.submit ?? this.options.schema),
      blur: isFunction(validate?.blur) ? validate.blur(state) : validate?.blur,
      focus: isFunction(validate?.focus) ? validate.focus(state) : validate?.focus,
    };
  }

  public buildFieldMeta = (
    fieldName: string,
    persistedMeta: PersistedFieldMeta | undefined,
    values: Values,
    errors: Record<string, FormIssue[]>,
  ): FieldMeta => {
    const path = stringToPath(fieldName);
    const value = get(values as never, path);
    const defaultValue = get(this.options.defaultValues, path);
    const invalid = errors[fieldName]?.length > 0;
    const baseMeta = persistedMeta ?? defaultMeta;

    return {
      ...baseMeta,
      default: value === defaultValue,
      pristine: !baseMeta.dirty,
      valid: !invalid,
    } satisfies FieldMeta;
  };

  public setFieldMeta = (name: string, meta: Partial<PersistedFieldMeta>) => {
    this.persisted.setState(current => {
      return {
        ...current,
        fields: {
          ...current.fields,
          [name]: {
            ...defaultMeta,
            ...this.persisted.state.fields[name],
            ...meta,
          },
        },
      };
    });
  };

  public resetFieldMeta = (name: string) => {
    this.persisted.setState(current => {
      const fields = { ...current.fields };
      const all = Object.keys(current.fields);
      const affected = all.filter(key => key.startsWith(name));

      for (const key of affected) {
        delete fields[key];
      }

      return {
        ...current,
        fields,
      };
    });
  };

  public setStatus = (status: Partial<PersistedFormStatus>) => {
    this.persisted.setState(current => {
      return {
        ...current,
        status: {
          ...current.status,
          ...status,
        },
      };
    });
  };

  public validate = async (
    field?: FormFields<FormApi<Values>> | FormFields<FormApi<Values>>[],
    options?: ValidateOptions,
  ) => {
    const validator = options?.type ? this.validator[options.type] : this.options.schema;

    if (!validator) return [];

    this.setStatus({ validating: true });

    const { issues: allIssues } = await validate(validator, this.store.state.values);

    if (!allIssues) {
      this.persisted.setState(current => {
        return { ...current, errors: {}, status: { ...current.status, validating: false } };
      });

      return [];
    }

    const fields = field ? (Array.isArray(field) ? field : [field]) : undefined;
    const related: string[] = fields?.flatMap(field => this.options.related?.[field as never] ?? []) ?? [];
    const affected = [...(fields ?? []), ...related];

    const issues = allIssues.filter(issue => {
      const path = issue.path?.join('.') ?? 'root';
      return !fields || affected.some(key => path.startsWith(key));
    });

    const errors = issues.reduce((acc, issue) => {
      const path = issue.path?.join('.') ?? 'root';
      return {
        ...acc,
        [path]: [...(acc[path] ?? []), issue],
      };
    }, {} as any);

    this.persisted.setState(current => {
      const existing = { ...current.errors };

      for (const key of affected) {
        delete existing[key];
      }

      return {
        ...current,
        errors: {
          ...(fields ? existing : {}), // when validating a specific set of fields, keep the existing errors
          ...errors,
        },
      };
    });

    this.setStatus({ validating: false });

    return issues;
  };
}
