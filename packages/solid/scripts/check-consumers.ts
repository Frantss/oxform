import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = fileURLToPath(new URL('../', import.meta.url));
const coreDirectory = fileURLToPath(new URL('../../core/', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'oxform-solid-consumers-'));
const run = (directory: string, args: string[]): void => {
  execFileSync('pnpm', args, { cwd: directory, stdio: 'inherit' });
};

try {
  const coreArchive = join(temporary, 'core.tgz');
  const solidArchive = join(temporary, 'solid.tgz');
  run(coreDirectory, ['pack', '--out', coreArchive]);
  run(packageDirectory, ['pack', '--out', solidArchive]);
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const workspace = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
  for (const version of [1, 2]) {
    const directory = join(temporary, `solid-${version}`);
    await mkdir(directory);
    const entry = version === 1 ? '@oxform/solid' : '@oxform/solid/v2';
    const dependencies = {
      '@oxform/core': `file:${coreArchive}`,
      '@oxform/solid': `file:${solidArchive}`,
      'solid-js': version === 1 ? '1.9.15' : '2.0.0-rc.13',
      zod: '4.6.5',
      ...(version === 2 ? { '@solidjs/web': '2.0.0-rc.13' } : {}),
    };
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({
        name: `solid-${version}-consumer`,
        private: true,
        type: 'module',
        dependencies,
        packageManager: workspace.packageManager,
        devDependencies: { typescript: manifest.devDependencies.typescript },
      }),
    );
    await writeFile(
      join(directory, 'pnpm-workspace.yaml'),
      `packages: []\noverrides:\n  '@oxform/core': ${JSON.stringify(`file:${coreArchive}`)}\n`,
    );
    await writeFile(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'esnext',
          module: 'nodenext',
          moduleResolution: 'nodenext',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['consumer.ts'],
      }),
    );
    await writeFile(
      join(directory, 'consumer.ts'),
      `
import { createForm, createField, createArrayField, createSubscribe } from '${entry}';
import { createRoot } from 'solid-js';
import z from 'zod';
createRoot(dispose => {
  const form = createForm({ schema: z.object({ name: z.string(), items: z.string().array() }), defaultValues: { name: 'Ada', items: [] } });
  const field = createField({ form, name: 'name' });
  const array = createArrayField({ form, name: 'items' });
  const selected: () => string = createSubscribe(form, state => state.values.name);
  const value: string = field.value;
  array.append(value);
  // @ts-expect-error field names must be schema paths.
  createField({ form, name: 'missing' });
  // @ts-expect-error field values must retain their schema type.
  field.change(123);
  console.log(selected());
  dispose();
});
`,
    );
    const smoke = `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createRoot } from 'solid-js';
import * as adapter from '${entry}';
import z from 'zod';
const require = createRequire(import.meta.url);
const verify = (binding, root) => root(dispose => {
  const form = binding.createForm({ schema: z.object({ name: z.string() }), defaultValues: { name: 'Ada' } });
  const field = binding.createField({ form, name: 'name' });
  field.change('Grace');
  assert.equal(field.get(), 'Grace');
  dispose();
});
verify(adapter, createRoot);
verify(require('${entry}'), require('solid-js').createRoot);
`;
    await writeFile(join(directory, 'smoke.mjs'), smoke);
    run(directory, ['install', '--offline', '--ignore-scripts']);
    run(directory, ['exec', 'tsc', '--noEmit']);
    execFileSync('node', ['smoke.mjs'], { cwd: directory, stdio: 'inherit' });
    console.log(`Packed Solid ${version} consumer: ESM, CJS, and types passed.`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
