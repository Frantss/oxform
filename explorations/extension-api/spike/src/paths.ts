/** Dotted paths. The empty path is the root. */
export const segments = (path: string) => (path === '' ? [] : path.split('.'));

export function getAt(data: unknown, path: string): unknown {
  return segments(path).reduce<unknown>(
    (current, key) => (current as Record<string, unknown> | undefined)?.[key],
    data,
  );
}

export function setAt<Values>(data: Values, [key, ...rest]: string[], value: unknown): Values {
  if (key === undefined) return value as Values;
  const copy = (Array.isArray(data) ? [...data] : { ...data }) as Record<string, unknown>;
  copy[key] = setAt(copy[key], rest, value);
  return copy as Values;
}

export const joinPath = (...parts: string[]) => parts.filter(part => part !== '').join('.');

/** `a.b.c` gives `['a.b', 'a', '']`: every ancestor, nearest first, ending at the root. */
export function ancestorsOf(path: string): string[] {
  const parts = segments(path);
  return parts.map((_, index) => parts.slice(0, parts.length - 1 - index).join('.'));
}

export function isDeepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;

  const leftKeys = Object.keys(left);
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every(key => isDeepEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]))
  );
}

export const isWithin = (path: string, prefix: string) =>
  prefix === '' || path === prefix || path.startsWith(`${prefix}.`);
