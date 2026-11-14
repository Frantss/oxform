import type { ArraysApi, FieldChangeOptions, FormContext, StatusApi, ValidationApi, ValuesApi } from '../../api';
import { checkInternals } from './check';
import { statusInternals } from './status';

/** Not on `ArraysApi`. An array handle exposes the ids as `ids`, through `arraysInternals(arrays)`. */
export interface ArraysInternals {
  ids(path: string): readonly string[];
}

const internals = new WeakMap<object, ArraysInternals>();

export function arraysInternals(arrays: object): ArraysInternals {
  const found = internals.get(arrays);
  if (!found) throw new Error('This behavior needs arrays created by createArray.');
  return found;
}

type Remap = (index: number) => number | undefined;

export function createArray<Values>(
  _ctx: FormContext,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly validation?: ValidationApi<Values>;
  },
): ArraysApi<Values> {
  const status = statusInternals(deps.status);
  const itemIds = new Map<string, string[]>();
  let counter = 0;
  const newId = () => `item-${counter++}`;

  const read = (path: string) => ((deps.values.get(path as never) as unknown[] | null | undefined) ?? []) as unknown[];
  const idsOf = (path: string) => {
    const ids = [...(itemIds.get(path) ?? [])];
    const length = read(path).length;
    while (ids.length < length) ids.push(newId());
    ids.length = length;
    itemIds.set(path, ids);
    return [...ids];
  };

  /** Writes the array, then moves ids and field state, marks the array and validates, unless the write is refused. */
  const commit = (
    path: string,
    next: unknown[],
    options: FieldChangeOptions | undefined,
    change: {
      readonly ids: string[];
      readonly remap?: Remap;
      readonly resetPath?: string;
      readonly validate?: boolean;
    },
  ) => {
    if (!deps.values.set(path as never, next as never, { reason: 'array' })) return;

    itemIds.set(path, change.ids);
    if (change.remap) {
      status.remap(path, change.remap);
      for (const check of deps.validation?.checks ?? []) checkInternals(check).remap(path, change.remap);
    }
    if (change.resetPath) status.reset({ path: change.resetPath });

    const { dirty = true, touch = true, validate } = options?.should ?? {};
    status.mark(path, { ...(dirty ? { dirty: true } : {}), ...(touch ? { touched: true } : {}) });

    const configured = deps.validation?.checks.some(check => check.validates('change')) ?? false;
    const requested = change.validate === false ? false : (validate ?? configured);
    if (deps.validation && requested) void deps.validation.run(path as never, { type: 'change' });
  };

  const clamp = (index: number, length: number) => Math.min(Math.max(index, 0), Math.max(length - 1, 0));

  const arrays: ArraysApi<Values> = {
    append(path, item, options) {
      const array = read(path);
      commit(path, [...array, item], options, { ids: [...idsOf(path), newId()], remap: index => index });
    },
    prepend(path, item, options) {
      commit(path, [item, ...read(path)], options, {
        ids: [newId(), ...idsOf(path)],
        remap: index => index + 1,
      });
    },
    insert(path, index, item, options) {
      const array = read(path);
      const at = Math.max(index, 0);
      const next = [...array];
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
      const first = Math.max(from, 0);
      const second = Math.max(to, 0);
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
      const source = Math.max(from, 0);
      const target = Math.max(to, 0);
      if (source >= array.length || target >= array.length) return;

      const order = array.map((_, index) => index);
      order.splice(target, 0, ...order.splice(source, 1));
      commit(
        path,
        order.map(index => array[index]),
        options,
        {
          ids: order.map(index => idsOf(path)[index]!),
          remap: index => order.indexOf(index),
        },
      );
    },
    update(path, index, item, options) {
      const array = read(path);
      const at = clamp(index, array.length);
      const next = [...array];
      next[at] = typeof item === 'function' ? (item as (current: unknown) => unknown)(array[at]) : item;
      commit(path, next, options, { ids: idsOf(path), resetPath: `${path}.${at}` });
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
      const array = read(path);
      const next = typeof items === 'function' ? (items as unknown as (current: unknown[]) => unknown[])(array) : items;
      commit(path, next as unknown[], options, { ids: (next as unknown[]).map(newId), resetPath: path });
    },
  };

  internals.set(arrays, { ids: idsOf });
  return arrays;
}
