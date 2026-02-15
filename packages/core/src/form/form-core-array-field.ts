import { defaultMeta } from '#field-api.constants';
import type { FormApi, FormArrayFields } from '#form-api';
import type { FieldChangeOptions } from '#form-api.types';
import type { FormCore } from '#form/form-core';
import type { FormCoreField } from '#form/form-core-field';
import type { FormCoreFields } from '#form/form-core-fields';
import type { DeepValue, UnwrapOneLevelOfArray } from '#more-types';
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

  public insert = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    index: number,
    value: Updater<UnwrapOneLevelOfArray<DeepValue<Values, Name>>>,
    options?: FieldChangeOptions,
  ) => {
    if (index < 0) index = 0;

    batch(() => {
      this.core.set(name, (incoming: unknown) => {
        const current = (incoming ?? []) as unknown[];

        return [
          ...current.slice(0, index),
          ...(Array.from({ length: index - current.length }, () => undefined) as any[]),
          update(current, value as never),
          ...current.slice(index),
        ] as never;
      });

      this.fields.set(name, {
        meta: {
          touched: options?.should?.dirty !== false,
          dirty: options?.should?.touch !== false,
        },
      });

      this.fields.reset(`${name}.${index}`);
      this.fields.adjust();
    });
  };

  public append = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    batch(() => {
      this.core.set(name, (incoming: unknown) => {
        const current = (incoming ?? []) as unknown[];

        return [
          ...current, value
        ];
      });

      this.fields.set(name, {
        meta: {
          touched: options?.should?.dirty !== false,
          dirty: options?.should?.touch !== false,
        },
      });

      this.fields.adjust();
    })
  };

  public prepend = <const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    batch(() => {
      this.core.set(name, (incoming: unknown) => {
        const current = (incoming ?? []) as unknown[];

        return [
          value, ...current
        ];
      });

      this.fields.set(name, {
        meta: {
          touched: options?.should?.dirty !== false,
          dirty: options?.should?.touch !== false,
        },
      });

      this.fields.shift(name, 0, 'right')
    })
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

    batch(() => {
      this.core.set(name, (incoming: unknown) => {
        const current = (incoming ?? []) as unknown[];

        const a = current[start];
        const b = current[end];

        return [...current.slice(0, start), b, ...current.slice(start + 1, end), a, ...current.slice(end + 1)] as never;
      });

      this.fields.set(name, {
        meta: {
          touched: options?.should?.dirty !== false,
          dirty: options?.should?.touch !== false,
        },
      });

      this.fields.shift(name, 0, 'right')
    })

    // this.core

    // this.core.persisted.setState(current => {
    //   const fields = { ...current.fields };

    //   fields[`${name}.${start}`] = current.fields[`${name}.${end}`] ?? defaultMeta;
    //   fields[`${name}.${end}`] = current.fields[`${name}.${start}`] ?? defaultMeta;

    //   return {
    //     ...current,
    //     fields,
    //   };
    // });
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
        fields[`${name}.${to}`] = current.fields[`${name}.${from}`] ?? defaultMeta;
      }

      for (let i = backwards ? start + 1 : start; i < end; i++) {
        const shift = backwards ? -1 : 1;
        const moving = current.fields[`${name}.${i + shift}`];
        fields[`${name}.${i}`] = moving ?? defaultMeta;
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
    this.field.change(
      name,
      current => {
        const array = (current as any[]) ?? [];
        const position = Math.max(Math.min(index, array.length - 1), 0);

        return [...array.slice(0, position), update(value, current as never), ...array.slice(position + 1)] as never;
      },
      options,
    );

    this.core.resetFieldMeta(`${name}.${index}`);
    this.core.setFieldMeta(`${name}.${index}`, {
      dirty: options?.should?.dirty !== false,
      touched: options?.should?.touch !== false,
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
        fields[`${name}.${i}`] = moving ?? defaultMeta;
      }

      delete fields[`${name}.${length}`];

      return {
        ...current,
        fields,
      };
    });

    const shouldValidate = options?.should?.validate !== false;
    if (shouldValidate) void this.core.validate(name, { type: 'change' });
  }

  public replace<const Name extends FormArrayFields<FormApi<Values>>>(
    name: Name,
    value: Updater<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) {
    this.core.resetFieldMeta(name);
    this.field.change(name, value as never, options);
  }
}
