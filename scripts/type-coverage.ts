import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The value and type names that a built declaration file exports, read from its `export` statements. */
export const exportedNames = (declarationPath: string): Set<string> => {
  const declaration = readFileSync(declarationPath, 'utf8');
  const listed = [...declaration.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)]
    .flatMap(match => match[1]!.split(','))
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
  ].map(match => match[1]!);
  return new Set([...listed, ...declared]);
};

const filesIn = (folder: string, pattern: RegExp): string[] =>
  readdirSync(folder)
    .sort()
    .flatMap(entry => {
      const path = join(folder, entry);
      if (statSync(path).isDirectory()) return filesIn(path, pattern);
      return pattern.test(path) ? [path] : [];
    });

const readJson = <Value>(path: string, fallback: Value): Value =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Value) : fallback;

/**
 * Checks the type tests of a package, run from its folder. Each entry is `[specifier, built declaration path]`.
 * Every export of an entry, and every name of `tests/types/inventory.json` for it, must be both exported and in the
 * inventory, be imported from the entry by a type test, and have a `describe` block that names it with a positive
 * case and a `@ts-expect-error` case. `tests/types/exemptions.json` lists the names with no negative case, with the
 * reason.
 */
export const checkTypeCoverage = (entries: Readonly<Record<string, string>>) => {
  const inventory = readJson<Record<string, string[]>>('tests/types/inventory.json', {});
  const exemptions = readJson<Record<string, string>>('tests/types/exemptions.json', {});
  const typeTests = filesIn('tests/types', /\.test-d\.tsx?$/).map(file => readFileSync(file, 'utf8'));

  const importedFrom = (specifier: string) =>
    new Set(
      typeTests.flatMap(source =>
        [...source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)]
          .filter(match => match[2] === specifier)
          .flatMap(match => match[1]!.split(',').map(item => item.trim().replace(/^type\s+/, '')))
          .filter(Boolean),
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
  for (const [name, reason] of Object.entries(exemptions)) {
    if (reason.trim() === '') findings.push(`The exemption of ${name} has no reason.`);
  }

  for (const [specifier, declarationPath] of Object.entries(entries)) {
    const exported = exportedNames(declarationPath);
    const listed = inventory[specifier] ?? [];
    const imported = importedFrom(specifier);

    for (const name of new Set([...exported, ...listed])) {
      const where = `${specifier} exports ${name}`;
      const named = blocks.filter(block => block.names.includes(name));

      if (!exported.has(name)) {
        findings.push(`${specifier} does not export ${name}, which 01-public-api.md lists.`);
        continue;
      }
      if (!listed.includes(name)) findings.push(`${where}, which is not in the inventory of 01-public-api.md.`);
      if (!imported.has(name)) findings.push(`${where}, which no type test imports from ${specifier}.`);
      if (!named.some(block => /\bexpectTypeOf\s*[<(]|\baccepts\s*[<(]/.test(block.body))) {
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
};
