import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Writes the generated parts of the comparison page from `data/comparison-features.json`. `comparison.mdx` includes
 * both Markdown files, so the `.md` route holds the table. The build reads no network: the staleness warning compares
 * each `readAt` with today's date. A `source` that starts with `/` is a page of this site; another relative `source`
 * is a file of the repository.
 */

interface FeatureRecord {
  row: string;
  library: string;
  value: string;
  note: string;
  source: string;
  version: string;
  readAt: string;
}

const appDirectory = join(import.meta.dirname, '..');
const featuresFile = join(appDirectory, 'data/comparison-features.json');
const generatedDirectory = join(appDirectory, 'content/docs/generated');
const sourceBaseUrl = 'https://github.com/frantss/oxform/blob/main/';
const staleAfterDays = 90;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const showPlannedSuffix = true;

const records: FeatureRecord[] = JSON.parse(readFileSync(featuresFile, 'utf8'));
const libraries = [...new Set(records.map(record => record.library))];
const rows = [...new Set(records.map(record => record.row))];

const sourceUrl = (record: FeatureRecord) =>
  /^(https?:|\/)/.test(record.source) ? record.source : sourceBaseUrl + record.source;
const escapeCell = (text: string) =>
  text.replace(/[\\{}<>|]/g, character => (character === '|' ? '\\|' : `\\${character}`));
const recordOf = (row: string, library: string) => {
  const record = records.find(candidate => candidate.row === row && candidate.library === library);
  if (!record) throw new Error(`Missing record: ${row} / ${library}`);
  return record;
};
const plannedSuffix = (record: FeatureRecord) =>
  showPlannedSuffix && record.note.startsWith('(planned)') ? ' (planned)' : '';

const matrix = [
  `| Row | ${libraries.join(' | ')} |`,
  `| --- | ${libraries.map(() => '---').join(' | ')} |`,
  ...rows.map(row => {
    const cells = libraries.map(library => {
      const record = recordOf(row, library);
      return `[${escapeCell(record.value)}](${sourceUrl(record)})${plannedSuffix(record)}`;
    });
    return `| ${escapeCell(row)} | ${cells.join(' | ')} |`;
  }),
];

const sources = [
  '| Row | Library | Value | Note | Version | Read on |',
  '| --- | --- | --- | --- | --- | --- |',
  ...records.map(record => {
    const note = record.note.replace(/^\(planned\)\s*/, '');
    return `| ${escapeCell(record.row)} | ${record.library} | [${escapeCell(record.value)}](${sourceUrl(record)})${plannedSuffix(record)} | ${escapeCell(note)} | ${escapeCell(record.version)} | ${record.readAt} |`;
  }),
];

const oldestReadAt = records.map(record => record.readAt).sort()[0];
const ageInDays = Math.floor((Date.now() - Date.parse(oldestReadAt)) / millisecondsPerDay);
const warning =
  ageInDays > staleAfterDays
    ? `> **Warning: this data may be out of date.** The oldest source was read on ${oldestReadAt}, ${ageInDays} days ago. Data older than ${staleAfterDays} days can differ from the current documentation of each library. Check a cell at its source link before you rely on it.\n`
    : '';

mkdirSync(generatedDirectory, { recursive: true });
writeFileSync(join(generatedDirectory, 'comparison-warning.md'), warning);
writeFileSync(join(generatedDirectory, 'comparison-matrix.md'), `${matrix.join('\n')}\n`);
writeFileSync(join(generatedDirectory, 'comparison-sources.md'), `${sources.join('\n')}\n`);

const publicDirectory = join(appDirectory, 'public');
mkdirSync(publicDirectory, { recursive: true });
copyFileSync(featuresFile, join(publicDirectory, 'comparison.json'));
