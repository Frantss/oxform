import { createFileRoute } from '@tanstack/react-router';
import { pageMarkdownFor } from '@/lib/markdown';

export const Route = createFileRoute('/docs.md')({
  server: {
    handlers: {
      GET: async ({ request }) => (await pageMarkdownFor(request)) ?? new Response('Not found', { status: 404 }),
    },
  },
});
