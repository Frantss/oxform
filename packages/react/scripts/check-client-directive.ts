import { readFileSync } from 'node:fs';

/** React Server Components read `'use client'` only as the first statement of the module the package exports. */
const entry = 'dist/index.js';
const firstLine = readFileSync(entry, 'utf8').split('\n', 1)[0]!.trim();
if (!/^(['"])use client\1;?$/.test(firstLine)) {
  console.error(`${entry} must start with 'use client', but its first line is: ${firstLine}`);
  process.exit(1);
}
