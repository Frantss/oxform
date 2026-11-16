import { readdirSync, readFileSync } from 'node:fs';

/** The public names of `01-public-api.md#6.2`. */
const inventory = JSON.parse(readFileSync('tests/types/inventory.json', 'utf8')) as string[];

const declaration = readFileSync('dist/index.d.ts', 'utf8');
const exported = [
  ...[...declaration.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)]
    .flatMap(match => match[1]!.split(','))
    .map(item =>
      item
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .at(-1)!,
    ),
  ...[...declaration.matchAll(/export\s+(?:declare\s+)?(?:const|function|type|interface|class)\s+(\w+)/g)].map(
    match => match[1]!,
  ),
].filter(Boolean);

const typeTests = readdirSync('tests/types')
  .filter(file => /\.test-d\.tsx?$/.test(file))
  .map(file => readFileSync(`tests/types/${file}`, 'utf8'));

const imported = new Set(
  typeTests.flatMap(source =>
    [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]@oxform\/react['"]/g)].flatMap(match =>
      match[1]!.split(',').map(item => item.trim().replace(/^type\s+/, '')),
    ),
  ),
);

/** Each top-level `describe` block, with the names in its title. */
const blocks = typeTests.flatMap(source => {
  const starts = [...source.matchAll(/^describe\(\s*(["'`])((?:\\.|(?!\1).)*)\1/gm)];
  return starts.map((match, index) => ({
    names: match[2]!.split(',').map(name => name.trim()),
    body: source.slice(match.index, starts[index + 1]?.index ?? source.length),
  }));
});

const findings: string[] = [];
for (const name of new Set([...exported, ...inventory])) {
  const where = `@oxform/react exports ${name}`;
  const named = blocks.filter(block => block.names.includes(name));
  if (!exported.includes(name)) findings.push(`@oxform/react does not export ${name}, which 01-public-api.md lists.`);
  if (!inventory.includes(name)) findings.push(`${where}, which is not in the inventory of 01-public-api.md.`);
  if (!imported.has(name)) findings.push(`${where}, which no type test imports from @oxform/react.`);
  if (!named.some(block => /\bexpectTypeOf\s*[<(]|\baccepts\s*[<(]/.test(block.body))) {
    findings.push(`${where}, which no describe block names with a positive case.`);
  }
  if (!named.some(block => block.body.includes('@ts-expect-error'))) {
    findings.push(`${where}, which no describe block names with a @ts-expect-error case.`);
  }
}

if (findings.length > 0) {
  console.error(`Type coverage issues:\n  ${findings.join('\n  ')}`);
  process.exit(1);
}

console.log('Type coverage check passed.');
