import { readFileSync } from 'node:fs';
import { entryPoints, exportedNames, type EntryPoint } from './declarations.ts';
import { filesIn } from './spec-files.ts';

const readJson = <Value>(path: string): Value => JSON.parse(readFileSync(path, 'utf8')) as Value;

/** The public names of `01-public-api.md`, by entry point. */
const inventory = readJson<Record<EntryPoint, string[]>>('tests/types/inventory.json');
/** The names that cannot have a negative case, with the reason. */
const exemptions = readJson<Record<string, string>>('tests/types/exemptions.json');

const typeTests = filesIn(['tests/types'], /\.test-d\.tsx?$/).map(file => readFileSync(file, 'utf8'));

const importedFrom = (specifier: string): Set<string> =>
  new Set(
    typeTests.flatMap(source =>
      [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)]
        .filter(match => match[2] === specifier)
        .flatMap(match => match[1].split(',').map(item => item.trim().replace(/^type\s+/, '')))
        .filter(Boolean),
    ),
  );

/** Each top-level `describe` block, with the names in its title. */
const blocks = typeTests.flatMap(source => {
  const starts = [...source.matchAll(/^describe\(\s*(["'`])((?:\\.|(?!\1).)*)\1/gm)];
  return starts.map((match, index) => ({
    names: match[2].split(',').map(name => name.trim()),
    body: source.slice(match.index, starts[index + 1]?.index ?? source.length),
  }));
});

const findings: string[] = [];

for (const entry of Object.keys(entryPoints) as EntryPoint[]) {
  const imported = importedFrom(entryPoints[entry]);

  for (const name of exportedNames(entry)) {
    const where = `${entryPoints[entry]} exports ${name}`;
    const named = blocks.filter(block => block.names.includes(name));

    if (!inventory[entry].includes(name)) findings.push(`${where}, which is not in the inventory of 01-public-api.md.`);
    if (!imported.has(name)) findings.push(`${where}, which no type test imports from ${entryPoints[entry]}.`);
    if (!named.some(block => block.body.includes('expectTypeOf('))) {
      findings.push(`${where}, which no describe block names with a positive case.`);
    }
    if (!(name in exemptions) && !named.some(block => block.body.includes('@ts-expect-error'))) {
      findings.push(`${where}, which no describe block names with a @ts-expect-error case.`);
    }
  }
}

if (findings.length > 0) {
  console.error(`Type coverage issues:\n  ${findings.join('\n  ')}`);
  process.exit(1);
}

console.log('Type coverage check passed.');
