export const getAscendantPaths = (key: string): string[] => {
  const parts = key.split('.');
  return parts.map((_, i) => parts.slice(0, i + 1).join('.'));
};
