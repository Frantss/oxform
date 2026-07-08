import * as tabs from 'fumadocs-ui/components/tabs';
import * as typeTable from 'fumadocs-ui/components/type-table';
import * as twoslash from 'fumadocs-twoslash/ui';
import defaultComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...tabs,
    ...typeTable,
    ...twoslash,
    ...components,
  };
}
