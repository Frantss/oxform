import { createFileRoute } from '@tanstack/react-router';
import { llmsIndex, textResponse } from '@/lib/markdown';

const comparisonData =
  '- **Data**\n- [comparison.json](/comparison.json): the feature data of the comparison page, one record per table cell\n';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () => textResponse(`${llmsIndex().trimEnd()}\n\n${comparisonData}`),
    },
  },
});
