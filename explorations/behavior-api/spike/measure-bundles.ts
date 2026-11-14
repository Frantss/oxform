import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

/** Gzip budgets in bytes: the measured size plus about 8%. The baseline is today's `@oxform/core`, reported only. */
const budgets: Record<string, number> = {
  'tier-values': 2500,
  'tier-status-events': 4050,
  'tier-values-and-check': 4400,
  'tier-values-check-fragments': 4700,
  'tier-lean-login': 5850,
  'tier-full-preset': 7700,
};

const root = new URL('./dist/', import.meta.url);
let overBudget = false;

for (const tier of readdirSync(root).sort()) {
  const directory = new URL(`${tier}/`, root);
  const code = Buffer.concat(
    readdirSync(directory)
      .filter(name => name.endsWith('.js'))
      .map(name => readFileSync(new URL(name, directory))),
  );
  const gzip = gzipSync(code).length;
  const budget = budgets[tier];
  const verdict = budget === undefined ? '' : gzip > budget ? `OVER budget ${budget}` : `within ${budget}`;
  if (budget !== undefined && gzip > budget) overBudget = true;

  console.log(
    `${tier.padEnd(24)} ${String(code.length).padStart(7)} B minified ${String(gzip).padStart(7)} B gzip  ${verdict}`,
  );
}

if (overBudget) process.exit(1);
