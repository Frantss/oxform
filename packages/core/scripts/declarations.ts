import { readFileSync } from 'node:fs';

export const entryPoints = {
  index: '@oxform/core',
  behaviors: '@oxform/core/behaviors',
  presets: '@oxform/core/presets',
  adapter: '@oxform/core/adapter',
} as const;

export type EntryPoint = keyof typeof entryPoints;

const dist = new URL('../dist/', import.meta.url);

/** The names that a built declaration entry exports, read from its `export` statements. */
export const exportedNames = (entry: EntryPoint): string[] => {
  const declaration = readFileSync(new URL(`${entry}.d.ts`, dist), 'utf8');
  const lists = [...declaration.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)].flatMap(match => match[1].split(','));
  const named = lists
    .map(
      item =>
        item
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)
          .at(-1) ?? '',
    )
    .filter(Boolean);
  const declared = [
    ...declaration.matchAll(/export\s+(?:declare\s+)?(?:const|function|type|interface|class)\s+(\w+)/g),
  ];
  return [...named, ...declared.map(match => match[1])];
};
