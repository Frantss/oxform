import type { FieldMeta, FormApi } from '#/core/form-api';
import type { DeepKeys, DeepValue } from '#/core/more-types';
import type { EventLike, SchemaLike } from '#/core/types';
import { get } from '#/utils/get';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Derived } from '@tanstack/store';
import { stringToPath } from 'remeda';

export type FieldOptions<
  Schema extends SchemaLike,
  Name extends DeepKeys<StandardSchemaV1.InferInput<Schema>> = DeepKeys<StandardSchemaV1.InferInput<Schema>>,
> = {
  form: FormApi<Schema>;
  name: Name;
};

export type FieldStore<Value> = {
  value: Value;
  defaultValue: Value;
  meta: FieldMeta;
};

export type FieldProps<Value> = {
  defaultValue: Value;
  value: Value;
  ref: (element: HTMLElement | null) => void;
  onChange: (event: EventLike) => void;
  onBlur: (event: EventLike) => void;
  onFocus: (event: EventLike) => void;
};

export class FieldApi<
  Schema extends SchemaLike,
  Name extends DeepKeys<StandardSchemaV1.InferInput<Schema>>,
  in out Value extends DeepValue<StandardSchemaV1.InferInput<Schema>, Name>,
> {
  public options: FieldOptions<Schema, Name>;
  public form: FormApi<Schema>;
  public store: Derived<FieldStore<Value>>;

  constructor(options: FieldOptions<Schema, Name>) {
    this.options = options;
    this.form = options.form;

    this.store = new Derived<FieldStore<Value>>({
      deps: [this.form.store],
      fn: () => {
        const value = this.form.get(this.options.name as never) as Value;
        const defaultValue = get(this.form.options.defaultValues as never, stringToPath(this.options.name)) as Value;
        const meta = this.form.meta(this.options.name as never);

        return {
          value,
          defaultValue,
          meta,
        };
      },
    });
  }

  public '~mount' = () => {
    const unsubscribe = this.store.mount();

    return unsubscribe;
  };

  public '~update' = (options: FieldOptions<Schema, Name>) => {
    // ref: https://github.com/TanStack/form/blob/main/packages/form-core/src/FieldApi.ts#L1300
    this.options = options;
  };

  public get value() {
    return this.store.state.value;
  }

  public get defaultValue() {
    return this.store.state.defaultValue;
  }

  public get meta() {
    return this.store.state.meta;
  }

  public focus = () => this.form.focus(this.options.name);

  public blur = () => this.form.blur(this.options.name);

  public change = (value: Value) => this.form.set(this.options.name, value);

  public register = () => this.form.register(this.options.name);
}
