import { BookOpen, Code2, GitFork } from 'lucide-react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Oxform',
    },
    links: [
      {
        text: 'Docs',
        url: '/docs/react',
        icon: <BookOpen />,
        active: 'nested-url',
      },
      {
        text: 'API',
        url: '/docs/react/api',
        icon: <Code2 />,
        active: 'nested-url',
      },
      {
        text: 'GitHub',
        url: 'https://github.com/frantss/oxform',
        icon: <GitFork />,
        external: true,
      },
    ],
  };
}
