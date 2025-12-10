import type { SchemaLike } from '#/types';
import { get } from '#/utils/get';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { Store } from '@tanstack/store';
import { setPath, stringToPath } from 'remeda';

// type FormStatusStore = {
//   submitted: boolean;
// }

type FormStore<Schema extends SchemaLike> = {
  values: StandardSchemaV1.InferInput<Schema>;
};

export type FieldMeta<Value> = {
  value: Value;
  defaultValue: Value;
  valid: boolean;
  touched: boolean;
  dirty: boolean;
  pristine: boolean;
  blurred: boolean;
};

type FieldsStore = {
  [key: string]: FieldMeta<any>;
}

type FieldControlReturn<Value> = {
  focus: () => void;
  blur: () => void;
  change: (value: Value)=> void
};

export type FormOptions<Schema extends SchemaLike> = {
  schema: Schema;
  values?: StandardSchemaV1.InferInput<Schema>;
  defaultValues: StandardSchemaV1.InferInput<Schema>;
};

export class FormApi<Schema extends SchemaLike> {
  public options!: FormOptions<Schema>;
  public store!: Store<FormStore<Schema>>;

  constructor(options: FormOptions<Schema>) {
    this.options = options;

    this.store = new Store<FormStore<Schema>>({
      values: options.values ?? options.defaultValues,
    });
  }

  public '~mount' = () => {
    const unsubscribe = () => {};

    return unsubscribe;
  }

  public '~update' = (options: FormOptions<Schema>) => {
    this.options = options;
  }

  public setFieldValue = (name: string, value: any) => {
    this.store.setState(current => {
      return setPath(current, ['values', ...stringToPath(name)] as any, value);
    });
  }

  public getFieldValue = (name: string) => {
    return get(this.store.state.values, stringToPath(name));
  }

  public getFieldMeta = (name: string) => {
    return {
      defaultValue: get(this.options.defaultValues, stringToPath(name)),
      valid: true,
      touched: false,
      dirty: false,
      pristine: false,
      blurred: false,
    };
  }

  public control = <Name extends string>(name: Name) => {
    return {
      blur: () => {
        console.log(`blur ${name}`);
      },
      focus: () => {
        console.log(`focus ${name}`);
      },
      change: (value: any) => {
        this.setFieldValue(name, value)
      }
    } satisfies FieldControlReturn<any> as FieldControlReturn<any>;
  }
}
