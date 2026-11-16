import { existsSync } from 'node:fs';
import { exportedNames } from '../../../scripts/type-coverage.ts';

/** The built declaration entry of each adapter. Arguments replace them, as `name=path` pairs. */
const declarations: Record<string, string> =
  process.argv.length > 2
    ? Object.fromEntries(process.argv.slice(2).map(pair => pair.split('=') as [string, string]))
    : {
        '@oxform/react': '../react/dist/index.d.ts',
        '@oxform/solid': '../solid/dist/index.d.ts',
        '@oxform/solid/v2': '../solid/dist/v2/index.d.ts',
      };

const findings: string[] = [];
const names = new Map<string, Set<string>>();
for (const [adapter, path] of Object.entries(declarations)) {
  if (!existsSync(path)) findings.push(`${adapter} has no built declarations at ${path}. Build it first.`);
  else names.set(adapter, exportedNames(path));
}

const all = new Set([...names.values()].flatMap(set => [...set]));
for (const [adapter, exported] of names) {
  const missing = [...all].filter(name => !exported.has(name)).sort();
  if (missing.length > 0)
    findings.push(`${adapter} does not export ${missing.join(', ')}, which another adapter exports.`);
}

if (findings.length > 0) {
  console.error(`Adapter parity issues:\n  ${findings.join('\n  ')}`);
  process.exit(1);
}

console.log(`Adapter parity check passed: ${[...names.keys()].join(', ')} export the same names.`);
