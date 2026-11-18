import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { llms } from 'fumadocs-core/source';
import type { InferPageType } from 'fumadocs-core/source';
import type * as PageTree from 'fumadocs-core/page-tree';
import { markdownUrlOf } from '../../content-pages';
import { source } from '@/lib/source';

type Page = InferPageType<typeof source>;

const markdownHeaders = { 'Content-Type': 'text/markdown; charset=utf-8' };
const textHeaders = { 'Content-Type': 'text/plain; charset=utf-8' };

export async function renderPageMarkdown(page: Page): Promise<string> {
  const body = await page.data.getText('processed');

  return `# ${page.data.title}\n\n${page.data.description}\n\n${body}`;
}

/** The pages of the sidebar, in sidebar order. A page hidden from the sidebar is not in the agent outputs either. */
function sidebarPages(): Page[] {
  const pages: Page[] = [];

  function visit(nodes: PageTree.Node[]) {
    for (const node of nodes) {
      if (node.type === 'page') {
        const page = source.getNodePage(node);
        if (page) pages.push(page);
      } else if (node.type === 'folder') {
        if (node.index) visit([node.index]);
        visit(node.children);
      }
    }
  }

  visit(source.getPageTree().children);

  return pages;
}

export function llmsIndex(): string {
  const index = llms(source).index();

  return index.replace(/\]\((\/docs[^)]*)\)/g, (_match, url: string) => `](${markdownUrlOf(url)})`);
}

export async function llmsFullText(): Promise<string> {
  const pages = await Promise.all(sidebarPages().map(renderPageMarkdown));

  return pages.join('\n\n');
}

const markdownPath = rewritePath('/docs{/*path}.md', '/docs{/*path}');

/**
 * The Markdown form of a page: at the page URL plus `.md`, or at the page URL when the request prefers
 * `text/markdown`. Returns `undefined` for any other request, so the HTML page renders.
 */
export async function pageMarkdownFor(request: Request): Promise<Response | undefined> {
  const pathname = new URL(request.url).pathname.replace(/\/$/, '');
  const rewritten = markdownPath.rewrite(pathname);
  const pagePath = rewritten === false ? (isMarkdownPreferred(request) ? pathname : undefined) : rewritten;

  if (pagePath === undefined) return;

  const page = source.getPage(pagePath.split('/').filter(Boolean).slice(1));

  if (!page) return rewritten === false ? undefined : new Response('Not found', { status: 404, headers: textHeaders });

  return markdownResponse(await renderPageMarkdown(page));
}

export function markdownResponse(markdown: string): Response {
  return new Response(markdown, { headers: markdownHeaders });
}

export function textResponse(text: string): Response {
  return new Response(text, { headers: textHeaders });
}
