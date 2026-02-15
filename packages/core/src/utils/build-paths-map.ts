import { isPlainObject } from 'remeda';

export const buildPathsMap = <Payload>(
  obj: unknown,
  builder: (path: string, value: any) => Payload,
  prefix: string = '',
): Record<string, Payload> => {
  if (!obj) return {};

  const entries = Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const current = [path, builder(path, value)] as const;

    if (isPlainObject(value)) {
      return [current, ...Object.entries(buildPathsMap(value, builder, path))];
    } else if (Array.isArray(value)) {
      const arrayEntries = value.flatMap((item, i) => {
        const itemPath = `${path}.${i}`;
        return [[itemPath, builder(itemPath, item)], ...Object.entries(buildPathsMap(item, builder, itemPath))];
      });

      return [current, ...arrayEntries];
    }

    return [current];
  });

  return Object.fromEntries(entries);
};
