export const get = (data: unknown, path: (string | number)[], fallback?: unknown) => {
  return path.reduce((acc, key) => {
    if (acc === undefined) return undefined;
    if (acc === null) return null;

    return (acc as any)[key] ?? fallback;
  }, data);
};
