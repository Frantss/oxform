import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Consumer = {
  /** A name for the log and the temporary folder. */
  name: string;
  /** Registry dependencies of the consumer, besides the packed workspace packages. */
  dependencies?: Record<string, string>;
  /** A consumer file. It is type-checked with `nodenext` resolution, then run with Node. */
  source: string;
};

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (directory: string, command: string, args: string[]): void => {
  execFileSync(command, args, { cwd: directory, stdio: 'inherit' });
};

/**
 * Packs the workspace packages, installs the tarballs in an empty ESM project per consumer, type-checks the
 * consumer file and runs it. `@oxform/core` is overridden with its tarball, so a peer dependency resolves to
 * the packed core.
 */
export const checkConsumers = async (packages: readonly string[], consumers: readonly Consumer[]): Promise<void> => {
  const workspace = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as { packageManager: string };
  const temporary = await mkdtemp(join(tmpdir(), 'oxform-consumers-'));
  try {
    const archives: Record<string, string> = {};
    for (const directory of ['core', ...packages]) {
      const packageDirectory = join(root, 'packages', directory);
      const { name } = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8')) as { name: string };
      archives[name] = join(temporary, `${directory}.tgz`);
      run(packageDirectory, 'pnpm', ['pack', '--out', archives[name]]);
    }
    const archiveVersions = Object.fromEntries(Object.entries(archives).map(([name, path]) => [name, `file:${path}`]));

    for (const consumer of consumers) {
      const directory = join(temporary, consumer.name);
      await mkdir(directory);
      const manifest = {
        name: `${consumer.name}-consumer`,
        private: true,
        type: 'module',
        packageManager: workspace.packageManager,
        dependencies: { ...archiveVersions, ...consumer.dependencies },
        devDependencies: { typescript: '7.0.2' },
      };
      const compilerOptions = { target: 'esnext', module: 'nodenext', strict: true, skipLibCheck: true, noEmit: true };
      await writeFile(join(directory, 'package.json'), JSON.stringify(manifest));
      await writeFile(
        join(directory, 'pnpm-workspace.yaml'),
        `packages: []\noverrides:\n  '@oxform/core': ${JSON.stringify(archiveVersions['@oxform/core'])}\n`,
      );
      await writeFile(join(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions, include: ['consumer.ts'] }));
      await writeFile(join(directory, 'consumer.ts'), consumer.source);
      run(directory, 'pnpm', ['install', '--offline', '--ignore-scripts']);
      run(directory, 'pnpm', ['exec', 'tsc', '--noEmit']);
      run(directory, 'node', ['consumer.ts']);
      console.log(`Consumer ${consumer.name}: install, type check and run passed.`);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
};
