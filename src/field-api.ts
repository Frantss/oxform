import type { FieldMeta, FormApi } from '#/form-api';
import type { EventLike, SchemaLike } from '#/types';
import { Derived } from '@tanstack/store';

export type FieldOptions = {
  form: FormApi<SchemaLike>;
  name: string;
};



type FieldPropsReturn<Value> = {
    defaultValue: Value;
    value: Value;
    ref: (element: HTMLElement | null) => void;
    onChange: (event: EventLike) => void;
    onBlur: (event: EventLike) => void;
    onFocus: (event: EventLike) => void;
  }

export class FieldApi<Value> {
  public options: FieldOptions;
  public form: FormApi<SchemaLike>;
  public store: Derived<FieldMeta<Value>>;

  constructor(options: FieldOptions) {
    this.options = options;
    this.form = options.form;

    this.store = new Derived<FieldMeta<Value>>({
      deps: [this.form.store],
      fn: () => {
        const value = this.form.getFieldValue(this.options.name) as Value;
        const { defaultValue, ...meta } = this.form.getFieldMeta(this.options.name);

        return {
          value,
          defaultValue: defaultValue as Value,
          ...meta,
        };
      },
    });
  }

  public '~mount' = () => {
    const unsubscribe = this.store.mount();

    return unsubscribe;
  }

  public '~update' = (options: FieldOptions) => {
    // ref: https://github.com/TanStack/form/blob/main/packages/form-core/src/FieldApi.ts#L1300
    this.options = options;
  }

  public control = () => {
    return this.form.control(this.options.name);
  }

  public props = () => {
    const control = this.control();
    const value = this.form.getFieldValue(this.options.name) as Value;
    const defaultValue = this.form.getFieldMeta(this.options.name).defaultValue as Value;

    return {
      value,
      defaultValue,
      onChange: (event) => {
        const value = event.target?.value;
        control.change(value);
      },
      onBlur: () => control.blur(),
      onFocus: () => control.focus(),
      ref: (element) => {
        console.log(`ref ${this.options.name}`, element);
      },
    } satisfies FieldPropsReturn<Value> as FieldPropsReturn<Value>;
  }
}
