/** The keys of a dotted path. The empty path is the root and has no key. */
export const segments = (path: string): string[] => (path === '' ? [] : path.split('.'));

export const getAt = (data: unknown, path: string): unknown =>
  segments(path).reduce<unknown>(
    (current, key) => (current as Record<string, unknown> | null | undefined)?.[key],
    data,
  );

const setAtKeys = (data: unknown, [key, ...rest]: string[], value: unknown): unknown => {
  if (key === undefined) return value;
  const copy = (Array.isArray(data) ? [...data] : { ...(data as object) }) as Record<string, unknown>;
  copy[key] = setAtKeys(copy[key], rest, value);
  return copy;
};

/** Writes a value at a path. Only the ancestors of the path get new references. */
export const setAt = <Data>(data: Data, path: string, value: unknown): Data =>
  setAtKeys(data, segments(path), value) as Data;

export const joinPath = (prefix: string, path: string): string =>
  prefix === '' ? path : path === '' ? prefix : `${prefix}.${path}`;

/** `a.b.c` gives `['a.b', 'a', '']`: each ancestor, nearest first, then the root. */
export const ancestorsOf = (path: string): string[] => {
  const keys = segments(path);
  return keys.map((_, index) => keys.slice(0, keys.length - 1 - index).join('.'));
};

/** True when the path is the prefix or is below it. Every path is within the root. */
export const isWithin = (path: string, prefix: string): boolean =>
  prefix === '' || path === prefix || path.startsWith(`${prefix}.`);

const isPlain = (value: object): boolean => {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null || Array.isArray(value);
};

/**
 * Compares plain objects and arrays by their own keys, dates by their time, and maps and sets by their entries.
 * Any other object, for example a `File`, is equal to itself only.
 */
export const isDeepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) return false;
  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;
  if (left instanceof Date) return Object.is(left.getTime(), (right as Date).getTime());
  if (left instanceof Set)
    return left.size === (right as Set<unknown>).size && [...left].every(item => (right as Set<unknown>).has(item));
  if (left instanceof Map) {
    const other = right as Map<unknown, unknown>;
    return (
      left.size === other.size &&
      [...left].every(([key, value]) => other.has(key) && isDeepEqual(value, other.get(key)))
    );
  }
  if (!isPlain(left)) return false;

  const leftKeys = Object.keys(left);
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every(
      key =>
        Object.hasOwn(right, key) &&
        isDeepEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
    )
  );
};
