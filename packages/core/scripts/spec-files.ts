import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const collect = (folder: string, pattern: RegExp): string[] => {
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .sort()
    .flatMap(entry => {
      const path = join(folder, entry);
      if (statSync(path).isDirectory()) return collect(path, pattern);
      return pattern.test(path) ? [path] : [];
    });
};

/** The files under the given folders whose path matches the pattern, in a stable order. */
export const filesIn = (folders: string[], pattern: RegExp): string[] =>
  folders.flatMap(folder => collect(folder, pattern));

export const specPattern = /\.spec\.tsx?$/;

export const lineOf = (source: string, index: number): number => source.slice(0, index).split('\n').length;
