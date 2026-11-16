import { contextInternals } from '#main/context';
import { defineExtension } from '#main/form';
import type { ArrayItem, ArrayPath, ArrayValue, Updater } from '#main/path-types';
import type { Extendable, FormContext, Needs } from '#main/types';
import { checkInternals } from './check';
import type { FieldChangeOptions } from './events';
import { statusInternals, type StatusApi } from './status';
import type { ValuesApi } from './values';

/** The operations on one array. An array handle has them, without the path. */
export interface ArrayOperations<Item, Value extends readonly unknown[]> {
  append(item: Item, options?: FieldChangeOptions): void;
  prepend(item: Item, options?: FieldChangeOptions): void;
  /** A negative index is 0. An index after the end pads the array with `undefined`. */
  insert(index: number, item: Item, options?: FieldChangeOptions): void;
  swap(from: number, to: number, options?: FieldChangeOptions): void;
  move(from: number, to: number, options?: FieldChangeOptions): void;
  /** Takes an updater of the item at the clamped index, and resets the state of that item. */
  update(index: number, item: Updater<Item>, options?: FieldChangeOptions): void;
  /** Always skips validation. */
  remove(index: number, options?: FieldChangeOptions): void;
  /** Takes an updater of the whole array, and resets the state of every item. */
  replace(items: Updater<Value>, options?: FieldChangeOptions): void;
}

export interface ArraysApi<Values> {
  append<At extends ArrayPath<Values>>(path: At, item: ArrayItem<Values, At>, options?: FieldChangeOptions): void;
  prepend<At extends ArrayPath<Values>>(path: At, item: ArrayItem<Values, At>, options?: FieldChangeOptions): void;
  insert<At extends ArrayPath<Values>>(
    path: At,
    index: number,
    item: ArrayItem<Values, At>,
    options?: FieldChangeOptions,
  ): void;
  swap(path: ArrayPath<Values>, from: number, to: number, options?: FieldChangeOptions): void;
  move(path: ArrayPath<Values>, from: number, to: number, options?: FieldChangeOptions): void;
  update<At extends ArrayPath<Values>>(
    path: At,
    index: number,
    item: Updater<ArrayItem<Values, At>>,
    options?: FieldChangeOptions,
  ): void;
  remove(path: ArrayPath<Values>, index: number, options?: FieldChangeOptions): void;
  replace<At extends ArrayPath<Values>>(
    path: At,
    items: Updater<ArrayValue<Values, At>>,
    options?: FieldChangeOptions,
  ): void;
}

/** Not on `ArraysApi`: an array handle reads the item ids. */
export interface ArraysInternals {
  /** Stable ids of the items. They follow the items through swap, move and remove. */
  ids(path: string): readonly string[];
}

const internals = new WeakMap<object, ArraysInternals>();

export const arraysInternals = (arrays: object): ArraysInternals => {
  const found = internals.get(arrays);
  if (!found) throw new TypeError('arraysInternals expects an arrays api made by the arrays extension.');
  return found;
};

type Remap = (index: number) => number | undefined;

/** What one operation changes besides the array. */
type Commit = {
  readonly ids: readonly string[];
  /** Moves the item state and the check entries. */
  readonly remap?: Remap;
  /** Resets the field state of this subtree. */
  readonly resetPath?: string;
  /** `false` skips validation, whatever the options say. */
  readonly validate?: false;
};

/** What `arrays` reads of a check through the validation link. */
type LinkedCheck = { validates(event: 'change'): boolean };

const clamp = (index: number, length: number) => Math.min(Math.max(index, 0), Math.max(length - 1, 0));

/** Array operations that move the values, the item ids, the item state and the check entries together. */
export const createArrays = <Values>(
  context: FormContext,
  deps: { readonly values: ValuesApi<Values>; readonly status: StatusApi<Values> },
): ArraysApi<Values> => {
  const status = statusInternals(deps.status);
  const itemIds = new Map<string, string[]>();
  let counter = 0;
  const newId = () => `item-${++counter}`;

  const read = (path: string) => (deps.values.get(path as never) as unknown[] | null | undefined) ?? [];
  const idsOf = (path: string) => {
    const ids = [...(itemIds.get(path) ?? [])];
    const { length } = read(path);
    while (ids.length < length) ids.push(newId());
    ids.length = length;
    itemIds.set(path, ids);
    return [...ids];
  };

  /** Writes the array, then moves the ids and the item state, marks the array and validates. A refused write stops. */
  const commit = (path: string, next: readonly unknown[], options: FieldChangeOptions | undefined, change: Commit) => {
    if (!deps.values.set(path as never, next as never, { reason: 'array' })) return;
    itemIds.set(path, [...change.ids]);
    const validation = contextInternals(context).validation();
    if (change.remap) {
      status.remap(path, change.remap);
      for (const check of validation.checks) checkInternals(check as object).remap(path, change.remap);
    }
    if (change.resetPath) status.reset({ path: change.resetPath });

    const { dirty = true, touch = true, validate } = options?.should ?? {};
    status.mark(path, { ...(dirty ? { dirty: true } : {}), ...(touch ? { touched: true } : {}) });
    const configured = (validation.checks as readonly LinkedCheck[]).some(check => check.validates('change'));
    if (change.validate !== false && (validate ?? configured)) void validation.run(path, { type: 'change' });
  };

  const arrays: ArraysApi<Values> = {
    append: (path, item, options) => commit(path, [...read(path), item], options, { ids: [...idsOf(path), newId()] }),
    prepend: (path, item, options) =>
      commit(path, [item, ...read(path)], options, { ids: [newId(), ...idsOf(path)], remap: index => index + 1 }),
    insert(path, index, item, options) {
      const at = Math.max(index, 0);
      const next = [...read(path)];
      const ids = idsOf(path);
      while (next.length < at) {
        next.push(undefined);
        ids.push(newId());
      }
      next.splice(at, 0, item);
      ids.splice(at, 0, newId());
      commit(path, next, options, { ids, remap: position => (position >= at ? position + 1 : position) });
    },
    swap(path, from, to, options) {
      const array = read(path);
      const [first, second] = [Math.max(from, 0), Math.max(to, 0)];
      if (first === second || first >= array.length || second >= array.length) return;
      const next = [...array];
      [next[first], next[second]] = [next[second], next[first]];
      const ids = idsOf(path);
      [ids[first], ids[second]] = [ids[second]!, ids[first]!];
      commit(path, next, options, {
        ids,
        remap: index => (index === first ? second : index === second ? first : index),
      });
    },
    move(path, from, to, options) {
      const array = read(path);
      const [source, target] = [Math.max(from, 0), Math.max(to, 0)];
      if (source === target || source >= array.length || target >= array.length) return;
      const order = array.map((_, index) => index);
      order.splice(target, 0, ...order.splice(source, 1));
      const ids = idsOf(path);
      commit(
        path,
        order.map(index => array[index]),
        options,
        { ids: order.map(index => ids[index]!), remap: index => order.indexOf(index) },
      );
    },
    update(path, index, item, options) {
      const array = read(path);
      const at = clamp(index, array.length);
      const next = [...array];
      next[at] = typeof item === 'function' ? (item as (current: unknown) => unknown)(array[at]) : item;
      commit(path, next, options, { ids: idsOf(path), resetPath: `${path as string}.${at}` });
    },
    remove(path, index, options) {
      const array = read(path);
      if (array.length === 0) return;
      const at = clamp(index, array.length);
      const ids = idsOf(path);
      ids.splice(at, 1);
      commit(
        path,
        array.filter((_, position) => position !== at),
        options,
        {
          ids,
          validate: false,
          remap: position => (position < at ? position : position === at ? undefined : position - 1),
        },
      );
    },
    replace(path, items, options) {
      const next = (
        typeof items === 'function' ? (items as (current: unknown) => unknown)(read(path)) : items
      ) as readonly unknown[];
      commit(path, next, options, { ids: next.map(newId), resetPath: path });
    },
  };

  internals.set(arrays, { ids: idsOf });
  return arrays;
};

/** `arrays`: operations that move the values, the item ids, the item state and the check entries together. */
export const arrays = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'status'>>) =>
  defineExtension(form, {
    name: 'arrays',
    needs: { api: ['values', 'status'] },
    api: (context, deps) => ({ arrays: createArrays<Values>(context, deps) }),
  });
