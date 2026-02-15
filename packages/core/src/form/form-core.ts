import { defaultStatus } from '#field-api.constants';
import type { FormBaseStore, FormOptions, FormStore } from '#form-api.types';
import { fields_build, fields_root } from '#utils/fields';
import { get } from '#utils/get';
import { update, type Updater } from '#utils/update';
import { Derived, Store } from '@tanstack/store';
import { entries, fromEntries, isDeepEqual, map, pipe, setPath, stringToPath } from 'remeda';

export class FormCore<Values> {
  public options!: FormOptions<Values>;
  public persisted: Store<FormBaseStore<Values>>;
  public store!: Derived<FormStore<Values>>;

  constructor(options: FormOptions<Values>) {
    this.options = options;

    this.persisted = new Store<FormBaseStore<Values>>({
      values: options.defaultValues,
      fields: fields_build(options.defaultValues),
      status: defaultStatus,
    });

    this.store = new Derived<FormStore<Values>>({
      deps: [this.persisted],
      fn: ({ currDepVals }) => {
        const persisted = currDepVals[0] as FormBaseStore<Values>;

        const invalid = Object.values(persisted.fields).some(field => field.errors.length > 0);
        const dirty = persisted.fields[fields_root].meta.dirty;
        const fields = pipe(
          persisted.fields,
          entries(),
          map(([key, field]) => {
            const path = stringToPath(key);
            const value = get(persisted.values as never, path);
            const defaultValue = get(this.options.defaultValues, path);

            return [
              key,
              {
                ...field,
                meta: {
                  ...field.meta,
                  default: isDeepEqual(value, defaultValue),
                  invalid: field.errors.length > 0,
                  pristine: !field.meta.dirty,
                },
              },
            ] as const;
          }),
          fromEntries(),
        ) as never;

        return {
          values: persisted.values,
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

  public set = (name: string, updater: Updater<unknown>) => {
    const path = stringToPath(name);

    this.persisted.setState(state => {
      return {
        ...state,
        values: setPath(state.values as never, path as never, update(updater, get(state.values, path)) as never),
      };
    });
  };

  // public get status() {
  //   return this.store.state.status;
  // }

  // public get values() {
  //   return this.store.state.values;
  // }

  // private get validator() {
  //   const { state } = this.store;
  //   const validate = this.options.validate;

  //   return {
  //     change: isFunction(validate?.change) ? validate.change(state) : validate?.change,
  //     submit: isFunction(validate?.submit) ? validate.submit(state) : (validate?.submit ?? this.options.schema),
  //     blur: isFunction(validate?.blur) ? validate.blur(state) : validate?.blur,
  //     focus: isFunction(validate?.focus) ? validate.focus(state) : validate?.focus,
  //   };
  // }

  // public setFields = (fields: Fields) => {
  //   this.persisted.setState(current => {
  //     return {
  //       ...current,
  //       fields,
  //     };
  //   });
  // };

  // public setStatus = (status: Partial<PersistedFormStatus>) => {
  //   this.persisted.setState(current => {
  //     return {
  //       ...current,
  //       status: {
  //         ...current.status,
  //         ...status,
  //       },
  //     };
  //   });
  // };

  // public validate = async (
  //   field?: FormFields<FormApi<Values>> | FormFields<FormApi<Values>>[],
  //   options?: ValidateOptions,
  // ) => {
  //   const validator = options?.type ? this.validator[options.type] : this.options.schema;

  //   if (!validator) return [];

  //   this.setStatus({ validating: true });

  //   const { issues: allIssues } = await validate(validator, this.store.state.values);

  //   if (!allIssues) {
  //     this.persisted.setState(current => {
  //       return { ...current, errors: {}, status: { ...current.status, validating: false } };
  //     });

  //     return [];
  //   }

  //   const fields = field ? (Array.isArray(field) ? field : [field]) : undefined;
  //   const related: string[] = fields?.flatMap(field => this.options.related?.[field as never] ?? []) ?? [];
  //   const affected = [...(fields ?? []), ...related];

  //   const issues = allIssues.filter(issue => {
  //     const path = issue.path?.join('.') ?? 'root';
  //     return !fields || affected.some(key => path.startsWith(key));
  //   });

  //   // FIXME: this is all wrong
  //   const errors = issues.reduce((acc, issue) => {
  //     const path = issue.path?.join('.') ?? 'root';
  //     return {
  //       ...acc,
  //       [path]: [...(acc[path] ?? []), issue],
  //     };
  //   }, {} as any);

  //   this.persisted.setState(current => {
  //     const existing = { ...current.fields };

  //     for (const key of affected) {
  //       existing[key].errors = [];
  //     }

  //     return {
  //       ...current,
  //       errors: {
  //         ...(fields ? existing : {}), // when validating a specific set of fields, keep the existing errors
  //         ...errors,
  //       },
  //     };
  //   });

  //   this.setStatus({ validating: false });

  //   return issues;
  // };
}
