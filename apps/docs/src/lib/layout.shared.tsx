import { DocsBrand } from '@frantss/fumadocs-theme';
import { BookOpen, Code2, GitFork } from 'lucide-react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <DocsBrand>Oxform</DocsBrand>,
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        icon: <BookOpen />,
        active: 'nested-url',
      },
      {
        text: 'Playground',
        url: '/playground',
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
