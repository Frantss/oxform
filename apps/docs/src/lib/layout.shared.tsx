import { DocsBrand } from '@frantss/fumadocs-theme';
import { BookOpen, Code2, GitFork } from 'lucide-react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(framework: 'react' | 'solid' = 'react'): BaseLayoutProps {
  return {
    nav: {
      title: <DocsBrand>Oxform</DocsBrand>,
    },
    links: [
      {
        text: 'Docs',
        url: `/docs/${framework}`,
        icon: <BookOpen />,
        active: 'nested-url',
      },
      {
        text: 'API',
        url: `/docs/${framework}/api`,
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
