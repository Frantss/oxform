import { globSync, readFileSync } from 'node:fs';

/**
 * The words that `00-direction.md#Glossary` replaces (`04-documentation.md#7.3`, rule 9). `check:terms` and
 * `docs:check:agents` both read this list. `publicOnly` terms are allowed in contributor material: the glossary
 * keeps "kernel" as the contributor word for the code behind `@oxform/core`.
 */
export const forbiddenTerms = [
  { term: 'fragment', use: 'scope' },
  { term: 'kind', use: 'a precise word ("prop kind" is allowed)' },
  { term: 'field extras', use: 'field members' },
  { term: 'form definition', use: 'form' },
  { term: 'configured form', use: 'form' },
  { term: 'pipe', use: 'chain' },
  { term: 'stage', use: 'step or extension' },
  { term: 'kernel', use: 'main APIs', publicOnly: true },
  { term: 'plugin', use: 'extension' },
  { term: 'behavior API', use: 'extension API' },
  { term: 'primitive', use: 'a precise word ("primitive" is allowed only in text about UI SDK)' },
] as const;

export type TermFormat = 'code' | 'markdown';

export interface TermOptions {
  format: TermFormat;
  /** `public` is the docs site. `contributor` is source, tests, examples and contributor documents. */
  audience: 'public' | 'contributor';
}

export interface TermFinding {
  line: number;
  term: string;
  use: string;
  text: string;
}

const allowedPhrases = /\bprop kinds?\b/gi;

function blank(text: string): string {
  return text.replace(/[^\n]/g, ' ');
}

/** Keeps only comments and string contents, so identifiers such as `PropKind` or a `kind` property pass. */
function proseOfCode(source: string): string {
  let out = '';
  let index = 0;

  while (index < source.length) {
    const rest = source.slice(index);
    const comment = /^(\/\/[^\n]*|\/\*[\s\S]*?(\*\/|$))/.exec(rest);
    const string = /^('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\[\s\S]|[^`\\])*`)/.exec(rest);
    const match = comment ?? string;

    if (match) {
      out += match[0];
      index += match[0].length;
    } else {
      out += source[index] === '\n' ? '\n' : ' ';
      index += 1;
    }
  }

  return out;
}

/** Removes code from Markdown: fenced blocks, inline code and link targets. */
function proseOfMarkdown(source: string): string {
  return source
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank)
    .replace(/`[^`\n]*`/g, blank)
    .replace(/\]\([^)\n]*\)/g, blank);
}

export function findForbiddenTerms(source: string, { format, audience }: TermOptions): TermFinding[] {
  const prose = (format === 'code' ? proseOfCode(source) : proseOfMarkdown(source)).replace(allowedPhrases, blank);
  const lines = prose.split('\n');
  const originalLines = source.split('\n');
  const findings: TermFinding[] = [];
  let paragraphStart = 0;

  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') paragraphStart = lineIndex + 1;

    for (const entry of forbiddenTerms) {
      if ('publicOnly' in entry && entry.publicOnly && audience !== 'public') continue;

      const words = entry.term.split(' ').join('\\s+');
      if (!new RegExp(`(?<![\\w$-])${words}s?(?![\\w$-])`, 'i').test(line)) continue;

      if (entry.term === 'primitive') {
        const paragraphEnd = lines.findIndex((text, index) => index > lineIndex && text.trim() === '');
        const paragraph = lines.slice(paragraphStart, paragraphEnd === -1 ? undefined : paragraphEnd).join('\n');
        if (/UI SDK/.test(paragraph)) continue;
      }

      findings.push({ line: lineIndex + 1, term: entry.term, use: entry.use, text: originalLines[lineIndex].trim() });
    }
  });

  return findings;
}

export function formatFinding(file: string, finding: TermFinding): string {
  return `${file}:${finding.line}: forbidden term "${finding.term}", use ${finding.use}: ${finding.text}`;
}

const scannedFiles = [
  'packages/*/src/**/*.{ts,tsx}',
  'packages/*/tests/**/*.{ts,tsx}',
  'examples/*/{src,tests}/**/*.{ts,tsx}',
  'examples/*/*.md',
  'docs/*.md',
];

if (import.meta.main) {
  const files = globSync(scannedFiles, { exclude: path => path.includes('node_modules') }).sort();
  const failures = files.flatMap(file =>
    findForbiddenTerms(readFileSync(file, 'utf8'), {
      format: file.endsWith('.md') ? 'markdown' : 'code',
      audience: 'contributor',
    }).map(finding => formatFinding(file, finding)),
  );

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    console.error(`\ncheck:terms: ${failures.length} forbidden term(s) in ${files.length} files.`);
    process.exit(1);
  }

  console.log(`check:terms: no forbidden term in ${files.length} files.`);
}
