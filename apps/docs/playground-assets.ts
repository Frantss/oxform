import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const examplesRoot = fileURLToPath(new URL('../../examples/', import.meta.url));
const frameworks = ['react', 'solid', 'solid-v2'] as const;
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    }),
  );
  return files.flat();
}

export function playgroundAssets(): Plugin {
  return {
    name: 'oxform-playground-assets',
    configureServer(server) {
      for (const framework of frameworks) {
        const directory = join(examplesRoot, framework, 'dist');
        server.middlewares.use('/playground/demos/' + framework, (request, response, next) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') return next();
          void (async () => {
            try {
              const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
              const path = resolve(directory, '.' + pathname);
              if (!path.startsWith(directory + sep)) {
                response.writeHead(404).end();
                return;
              }
              const content = await readFile(path);
              response.setHeader('Content-Type', contentTypes[extname(path)] ?? 'application/octet-stream');
              response.end(request.method === 'HEAD' ? undefined : content);
            } catch {
              response.writeHead(404).end();
            }
          })();
        });
      }
    },
    async generateBundle() {
      if (this.environment.name !== 'client') return;
      for (const framework of frameworks) {
        const directory = join(examplesRoot, framework, 'dist');
        for (const path of await filesIn(directory)) {
          this.emitFile({
            type: 'asset',
            fileName: 'playground/demos/' + framework + '/' + relative(directory, path).split(sep).join('/'),
            source: await readFile(path),
          });
        }
      }
    },
  };
}
