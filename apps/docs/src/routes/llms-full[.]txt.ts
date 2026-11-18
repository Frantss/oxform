import { createFileRoute } from '@tanstack/react-router';
import { llmsFullText, textResponse } from '@/lib/markdown';

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => textResponse(await llmsFullText()),
    },
  },
});
