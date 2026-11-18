import { join } from 'node:path';
import { isMarkdownPreferred } from 'fumadocs-core/negotiation';
import { serve, type ServerMiddleware } from 'srvx';
import { loggerMiddleware } from 'srvx/log';
import { staticMiddleware } from 'srvx/static';

process.env.NODE_ENV ??= 'production';

/** The build output of TanStack Start, which has no declaration file. */
const serverEntry = './dist/server/server.js';
const { default: app }: { default: { fetch: (request: Request) => Promise<Response> } } = await import(serverEntry);

/**
 * A prerendered page has an HTML file, and a static file would answer first. So the app answers each request for
 * Markdown: a `.md` URL, or a docs URL with `Accept: text/markdown`. The app also sets the Markdown content type.
 */
const markdownFirst: ServerMiddleware = (request, next) => {
  const { pathname } = new URL(request.url);
  const wantsMarkdown = pathname.endsWith('.md') || (pathname.startsWith('/docs') && isMarkdownPreferred(request));

  return wantsMarkdown ? app.fetch(request) : next();
};

serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: '0.0.0.0',
  fetch: app.fetch,
  middleware: [loggerMiddleware(), markdownFirst, staticMiddleware({ dir: join(import.meta.dirname, 'dist/client') })],
});
