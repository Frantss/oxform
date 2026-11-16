import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { allowedImports, fullTier, markers, tiers, type Marker } from '../tests/bundle/markers.ts';

const bundle = new URL('../tests/bundle/', import.meta.url);
const failures: string[] = [];

// The minifier may write a string literal with any quote character.
const contains = (output: string, marker: Marker): boolean => new RegExp(`[\`'"]${markers[marker]}[\`'"]`).test(output);

const outputOf = (tier: string): string | undefined => {
  const directory = new URL(`dist/${tier}/`, bundle);
  if (!existsSync(directory)) return undefined;
  return readdirSync(directory)
    .filter(name => name.endsWith('.js'))
    .map(name => readFileSync(new URL(name, directory), 'utf8'))
    .join('\n');
};

for (const [tier, forbidden] of Object.entries(tiers)) {
  const source = readFileSync(new URL(`${tier}.ts`, bundle), 'utf8');
  for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (!allowedImports.includes(specifier))
      failures.push(`${tier} imports ${specifier}, which is not a public entry point.`);
  }

  const output = outputOf(tier);
  if (output === undefined) {
    failures.push(`${tier} has no build output.`);
    continue;
  }
  for (const marker of forbidden) {
    if (contains(output, marker)) failures.push(`${tier} contains ${marker}, which its chain does not import.`);
  }
  if (tier === fullTier) {
    for (const marker of Object.keys(markers) as Marker[]) {
      if (!contains(output, marker)) failures.push(`${tier} lacks the marker of ${marker}, so the marker is stale.`);
    }
  }
}

for (const failure of failures) console.error(failure);
if (failures.length > 0) process.exit(1);
console.log(`Tree-shaking check passed for ${Object.keys(tiers).length} tiers.`);
