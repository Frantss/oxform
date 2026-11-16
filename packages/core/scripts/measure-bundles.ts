import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { tiers } from '../tests/bundle/markers.ts';

// A report, not a check: it prints the size of each tier and never fails on a size.
const dist = new URL('../tests/bundle/dist/', import.meta.url);

for (const tier of Object.keys(tiers)) {
  const directory = new URL(`${tier}/`, dist);
  const code = Buffer.concat(
    readdirSync(directory)
      .filter(name => name.endsWith('.js'))
      .map(name => readFileSync(new URL(name, directory))),
  );
  const gzip = gzipSync(code).length;
  console.log(`${tier.padEnd(24)} ${String(code.length).padStart(7)} B minified ${String(gzip).padStart(7)} B gzip`);
}
