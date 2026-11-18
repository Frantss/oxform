import { DocsBody, DocsDescription, DocsLayout, DocsPage, DocsTitle } from '@frantss/fumadocs-theme';
import { MarkdownCopyButton, ViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';
import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import browserCollections from 'collections/browser';
import type { ComponentType } from 'react';
import { markdownUrlOf } from '../../content-pages';
import { baseOptions } from '@/lib/layout.shared';
import { pageMarkdownFor } from '@/lib/markdown';
import { source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

export const Route = createFileRoute('/docs/$')({
  server: {
    handlers: {
      GET: async ({ request, next }) => (await pageMarkdownFor(request)) ?? next(),
    },
  },
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? [];
    const data = await serverLoader({ data: slugs });

    await clientLoader.preload(data.path);

    return data;
  },
});

const legacyRoots = new Set(['react', 'solid', 'core']);

const serverLoader = createServerFn({
  method: 'GET',
})
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);

    if (!page) {
      if (slugs.length === 1 && legacyRoots.has(slugs[0])) throw redirect({ href: '/docs' });

      throw notFound();
    }

    return {
      path: page.path,
      markdownUrl: markdownUrlOf(page.url),
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component({ default: MDX, frontmatter, toc }, { markdownUrl }: { markdownUrl: string }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className='flex flex-row items-center gap-2 border-b pb-6'>
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover markdownUrl={markdownUrl} />
        </div>
        <DocsBody>
          <MDX components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = Route.useLoaderData();
  const { pageTree } = useFumadocsLoader(data);
  const Content = clientLoader.getComponent(data.path) as unknown as ComponentType<{ markdownUrl: string }>;

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Content markdownUrl={data.markdownUrl} />
    </DocsLayout>
  );
}
