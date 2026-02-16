import { defaultMeta } from '#field-api.constants';
import type { FormApi, FormArrayFields } from '#form-api';
import type { FieldChangeOptions } from '#form-api.types';
import type { FormCore } from '#form/form-core';
import type { FormCoreField } from '#form/form-core-field';
import type { FormCoreFields } from '#form/form-core-fields';
import type { DeepValue, UnwrapOneLevelOfArray } from '#more-types';
import { generateId } from '#utils/generate-id';
import { get } from '#utils/get';
import { update, type Updater } from '#utils/update';
import { batch } from '@tanstack/store';
import { stringToPath } from 'remeda';

export class FormCoreArray<Values> {
  private core: FormCore<Values>;
  private fields: FormCoreFields<Values>;
  private field: FormCoreField<Values>;

  constructor({
    core,
    fields,
    field,
  }: {
    core: FormCore<Values>;
    fields: FormCoreFields<Values>;
    field: FormCoreField<Values>;
  }) {
    this.core = core;
    this.field = field;
    this.fields = fields;
  }

  private createField = () => {
    return {
      id: generateId(),
      meta: { ...defaultMeta },
      errors: [],
      ref: null,
    };
  };

  public insert = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    if (index < 0) index = 0;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];

        return [
          ...array.slice(0, index),
          ...(Array.from({ length: index - array.length }, () => undefined) as any[]),
          update(value, current as never),
          ...array.slice(index),
        ] as never;
      },
      options,
    );

    this.core.persisted.setState(current => {
      const fields = { ...current.fields };
      const currentValue = get(current.values as never, stringToPath(name)) as any[] | undefined;
      const length = currentValue?.length;

      if (length === undefined) return current;

      for (let i = index; i < length; i++) {
        const moving = current.fields[`${name}.${i}`];
        fields[`${name}.${i + 1}`] = moving ?? this.createField();
      }

      fields[`${name}.${index}`] = this.createField();

      return {
        ...current,
        fields,
      };
    });
  };

  public append = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const current = this.field.get(name) as any[] | undefined;
    return this.insert(name, current?.length ?? 0, value, options);
  };

  public prepend = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    return this.insert(name, 0, value, options);
  };

  public swap = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    from: number,
    to: number,
    options?: FieldChangeOptions,
  ) => {
    const start = from >= 0 ? from : 0;
    const end = to >= 0 ? to : 0;

    if (start === end) return; // no-op

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        const updated = [...array];

        [updated[start], updated[end]] = [updated[end], updated[start]];

        return updated as never;
      },
      options,
    );

    this.core.persisted.setState(current => {
      const fields = { ...current.fields };

      fields[`${name}.${start}`] = current.fields[`${name}.${end}`] ?? this.createField();
      fields[`${name}.${end}`] = current.fields[`${name}.${start}`] ?? this.createField();

      return {
        ...current,
        fields,
      };
    });
  };

  public move<const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    _from: number,
    _to: number,
    options?: FieldChangeOptions,
  ) {
    const from = Math.max(_from, 0);
    const to = Math.max(_to, 0);
    const backwards = from > to;

    this.field.change(
      name,
      current => {
        const array: any[] = current ? [...(current as any[])] : [];

        if (from === to) return array as never;

        const moved = array[from];
        return array.toSpliced(backwards ? to : to + 1, 0, moved).toSpliced(backwards ? from + 1 : from, 1) as never;
      },
      options,
    );

    this.core.persisted.setState(current => {
      const fields = { ...current.fields };
      const value = get(current.values as never, stringToPath(name)) as any[] | undefined;
      const length = value?.length;

      const start = Math.min(from, to);
      const end = Math.max(from, to);

      if (length === undefined) return current;

      if (!backwards) {
        fields[`${name}.${to}`] = current.fields[`${name}.${from}`] ?? this.createField();
      }

      for (let i = backwards ? start + 1 : start; i < end; i++) {
        const shift = backwards ? -1 : 1;
        const moving = current.fields[`${name}.${i + shift}`];
        fields[`${name}.${i}`] = moving ?? this.createField();
      }

      return {
        ...current,
        fields,
      };
    });
  }

  public update = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    let position = index;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        position = Math.max(Math.min(index, array.length - 1), 0);

        return [...array.slice(0, position), update(value, array[position] as never), ...array.slice(position + 1)] as never;
      },
      options,
    );

    batch(() => {
      this.fields.reset(`${name}.${position}`);
      this.fields.set(`${name}.${position}`, {
        meta: {
          dirty: options?.should?.dirty !== false,
          touched: options?.should?.touch !== false,
        },
      });
    });
  };

  public remove<const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    index: number,
    options?: FieldChangeOptions,
  ) {
    let position = index;

    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        position = Math.max(Math.min(index, array.length - 1), 0);

        return [...array.slice(0, position), ...array.slice(position + 1)] as never;
      },
      { ...options, should: { ...options?.should, validate: false } },
    );

    this.core.persisted.setState(current => {
      const fields = { ...current.fields };
      const value = get(current.values as never, stringToPath(name)) as any[] | undefined;
      const length = value?.length ?? 0;

      for (let i = position; i < length; i++) {
        const moving = current.fields[`${name}.${i + 1}`];
        fields[`${name}.${i}`] = moving ?? this.createField();
      }

      delete fields[`${name}.${length}`];

      return {
        ...current,
        fields,
      };
    });

  }

  public replace<const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    value: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) {
    batch(() => {
      this.fields.reset(name);
      this.field.change(name, value as never, options);
    });
  }
}
