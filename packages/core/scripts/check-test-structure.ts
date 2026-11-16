import { existsSync, readFileSync } from 'node:fs';
import { filesIn, lineOf, specPattern } from './spec-files.ts';

const casePattern = /\b(?:it|test)(?:\.each\([^)]*\))?\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
const allowPattern = /oxform-test-structure:\s*allow-multiple-assertions\s+--\s+\S+/;
const findings: string[] = [];

for (const module of filesIn(['src'], /\.tsx?$/).filter(file => !specPattern.test(file))) {
  const spec = module.replace(/\.(tsx?)$/, '.spec.$1');
  if (!existsSync(spec)) findings.push(`${module}\n  The runtime module has no sibling spec ${spec}.`);
}

for (const file of filesIn(['src', 'tests'], specPattern)) {
  const source = readFileSync(file, 'utf8');
  const cases = [...source.matchAll(casePattern)];

  cases.forEach((match, index) => {
    const body = source.slice(match.index, cases[index + 1]?.index ?? source.length);
    const assertions = body.match(/\bexpect(?:\.element)?\s*\(/g)?.length ?? 0;
    const place = `${file}:${lineOf(source, match.index)} ${match[2]}`;

    if (assertions > 1 && !allowPattern.test(body)) {
      findings.push(
        `${place}\n  ${assertions} runtime assertions: split the case, or add an allow comment with a reason.`,
      );
    }
    if (assertions === 0 && !body.includes('expectTypeOf(') && !body.includes('@ts-expect-error')) {
      findings.push(`${place}\n  The case has no runtime, type or @ts-expect-error assertion.`);
    }
  });
}

if (findings.length > 0) {
  console.error(`Core test structure issues:\n\n${findings.join('\n\n')}`);
  process.exit(1);
}

console.log('Core test structure check passed.');
