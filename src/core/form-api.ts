import type { DeepKeys, DeepValue } from '#/core/more-types';
import type { SchemaLike } from '#/core/types';
import { get } from '#/utils/get';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { batch, Store } from '@tanstack/store';
import { isDeepEqual, mergeDeep, setPath, stringToPath } from 'remeda';

// type FormStatusStore = {
//   submitted: boolean;
// }

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
};

export type FieldControl<Value> = {
  focus: () => void;
  blur: () => void;
  change: (value: Value) => void;
  register: (element: HTMLElement | null) => void;
};

export type FormOptions<Schema extends SchemaLike> = {
  schema: Schema;
  values?: StandardSchemaV1.InferInput<Schema>;
  defaultValues: StandardSchemaV1.InferInput<Schema>;
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
    });
  }

  public '~mount' = () => {
    const unsubscribe = () => {};

    return unsubscribe;
  };

  public '~update' = (options: FormOptions<Schema>) => {
    this.options = options;
  };

  private updateMeta = (name: string, meta: Partial<Pick<FieldMeta, 'dirty' | 'blurred' | 'touched'>>) => {
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

  public set = <Name extends Field>(name: Name, value: DeepValue<Values, Name>) => {
    const values = setPath(this.store.state.values as never, stringToPath(name as never) as any, value as never);

    batch(() => {
      this.store.setState(current => {
        return {
          ...current,
          values,
        };
      });

      this.updateMeta(name as never, { dirty: true });
    });
  };

  public focus = <Name extends Field>(name: Name) => {
    const ref = this.store.state.refs[name as never];

    if (!ref) return; // todo: add way of reporting missing refs

    ref.focus();

    this.updateMeta(name as never, { touched: true });
  };

  public blur = <Name extends Field>(name: Name) => {
    const ref = this.store.state.refs[name as never];

    if (!ref) return; // todo: add way of reporting missing refs

    ref.blur();

    this.updateMeta(name as never, { blurred: true });
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
}
