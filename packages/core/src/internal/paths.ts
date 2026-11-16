export const joinPath = (prefix: string, path: string): string =>
  prefix && path ? `${prefix}.${path}` : prefix || path;
