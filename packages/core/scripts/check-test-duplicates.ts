import { readFileSync } from 'node:fs';
import { filesIn, lineOf, specPattern } from './spec-files.ts';

const titlePattern = /\b(describe|it|test)(?:\.each\([^)]*\))?\(\s*(["'`])((?:\\.|(?!\2).)*)\2/g;
const places = new Map<string, string[]>();

for (const file of filesIn(['src', 'tests'], specPattern)) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(titlePattern)) {
    const title = match[3];
    places.set(title, [...(places.get(title) ?? []), `${file}:${lineOf(source, match.index)} ${match[1]}`]);
  }
}

const duplicates = [...places].filter(([, found]) => found.length > 1);

if (duplicates.length > 0) {
  console.error('Duplicate core test titles:');
  for (const [title, found] of duplicates) console.error(`\n${found.length}x ${title}\n  ${found.join('\n  ')}`);
  process.exit(1);
}

console.log(`No duplicate core test titles in ${places.size} titles.`);
