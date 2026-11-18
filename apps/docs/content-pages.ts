import { globSync } from 'node:fs';
import { join } from 'node:path';

export const contentDirectory = 'content/docs';

export const sectionFolders = [
  'core',
  'concepts',
  'compose',
  'extend',
  'behaviors',
  'presets',
  'adapters',
  'recipes',
  'migration',
] as const;

/** The page files of the docs collection, relative to `contentDirectory`. `templates/` is not a page folder. */
export const pageFilePatterns = ['*.{md,mdx}', `{${sectionFolders.join(',')}}/**/*.{md,mdx}`];

export function listPageFiles(appDirectory: string): string[] {
  return globSync(pageFilePatterns, { cwd: join(appDirectory, contentDirectory) }).sort();
}

export function pageUrlOf(pageFile: string): string {
  const slugs = pageFile.replace(/\.mdx?$/, '').split('/');

  if (slugs.at(-1) === 'index') slugs.pop();

  return ['/docs', ...slugs].join('/');
}

export function markdownUrlOf(pageUrl: string): string {
  return `${pageUrl}.md`;
}
