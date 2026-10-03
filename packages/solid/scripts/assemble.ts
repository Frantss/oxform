import { cp, mkdir, rm } from 'node:fs/promises';
import { watch } from 'node:fs';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const sources = [new URL('../../solid-v1/dist/', import.meta.url), new URL('../../solid-v2/dist/', import.meta.url)];
const copy = async (): Promise<void> => {
  await cp(sources[0], output, { recursive: true });
  await cp(sources[1], new URL('v2/', output), { recursive: true });
};
await copy();

if (process.argv.includes('--watch')) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let copying = Promise.resolve();
  for (const source of sources)
    watch(source, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        copying = copying.then(copy).catch(error => {
          // Pack removes old output before writing the replacement files.
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.error(error);
        });
      }, 100);
    });
}
