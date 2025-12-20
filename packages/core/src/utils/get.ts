export const get = (data: unknown, path: (string | number)[]) => {
  return path.reduce((acc, key) => {
    if (acc === undefined) return undefined;
    if (acc === null) return null;

    return (acc as any)[key];
  }, data);
};
