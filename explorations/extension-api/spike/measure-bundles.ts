import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

/**
 * Gzip budgets in bytes: the measured size plus about 8%, rounded up to 50. The baseline is today's `@oxform/core`,
 * reported only. The old spike's budgets (2500, 4050, 4400, 4700, 5850, 7700) measured behaviors re-exported without a
 * form. These tiers build a real form with `defineForm(...).extend(...)`, so they include the builder runtime and the
 * extension wrappers. `tier-builder-only` and `tier-values-behavior` are diagnostics with no budget.
 */
const budgets: Record<string, number> = {
  'tier-values': 3800,
  'tier-status-events': 5400,
  'tier-values-and-check': 5150,
  'tier-values-check-scopes': 5500,
  'tier-lean-login': 6950,
  'tier-full-preset': 9250,
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
