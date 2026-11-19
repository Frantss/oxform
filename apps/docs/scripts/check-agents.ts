import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { findForbiddenTerms } from '../../../scripts/check-terms.ts';
import { contentDirectory, listPageFiles, markdownUrlOf, pageUrlOf } from '../content-pages.ts';

/**
 * `docs:check:agents` (rules in `apps/docs/README.md`, "Agent checks"). Run it after `pnpm run docs:build`: it
 * reads the content files and the prerendered output in `dist/client`. Each failure names the file and the rule.
 * `--record-heading-ids` adds new heading ids to `heading-ids.json`. It never removes one.
 */

const appDirectory = join(import.meta.dirname, '..');
const repositoryDirectory = join(appDirectory, '../..');
const pagesDirectory = join(appDirectory, contentDirectory);
const outputDirectory = join(appDirectory, 'dist/client');
const headingIdsFile = join(import.meta.dirname, 'heading-ids.json');
const imageAllowlistFile = join(import.meta.dirname, 'image-allowlist.json');

type PageType = 'concept' | 'guide' | 'reference' | 'extension' | 'recipe' | 'adapter' | 'overview';

/** The fixed H2 headings of `04#6`, in order. A heading that ends in `?` is optional. */
const fixedHeadings: Record<Exclude<PageType, 'overview'>, string[]> = {
  concept: ['In short', 'Model', 'Rules', 'Example', 'Common mistakes', 'Related'],
  guide: ['Problem', 'What you build', 'Steps', 'Complete example', 'Verify', 'Common mistakes', 'Related'],
  reference: [
    'When to use',
    'Import',
    'Minimal example',
    'Signature',
    'Parameters',
    'Returns',
    'Rules',
    'Common mistakes',
    'Related',
  ],
  extension: [
    'When to use',
    'Import',
    'Minimal example',
    'Needs',
    'Adds',
    'Order',
    'Use from an extension?',
    'Rules',
    'Common mistakes',
    'Related',
  ],
  recipe: ['Problem', 'Solution', 'How it works?', 'Variations?', 'Related'],
  adapter: [
    'Install',
    'Create the parts',
    'Parts',
    'Hooks',
    'Custom parts',
    'Server rendering',
    'Differences',
    'Common mistakes',
    'Related',
  ],
};

/** Overview pages fix only their first and last heading. */
const overviewHeadings = { first: 'In short', last: 'Related' };

const typesWithExamples = new Set<PageType>(['guide', 'reference', 'extension', 'recipe']);

/** Reference folders and their entry points (`04#3`). */
const referenceFolders = {
  core: '@oxform/core',
  behaviors: '@oxform/core/behaviors',
  presets: '@oxform/core/presets',
} as const;

/** Form methods and an instance member have a page but no export of their own (`04#3`). */
const inventoryExemptPages = new Set([
  'core/extend.mdx',
  'core/configure.mdx',
  'core/create.mdx',
  'behaviors/scope.mdx',
]);

const exampleSources = ['examples/{kit,react,solid,solid-v2}/src/**/*.{ts,tsx}'];

interface Frontmatter {
  title: string;
  description: string;
  type: PageType;
  entry: string[];
  examples: string[];
}

interface Heading {
  depth: number;
  text: string;
  id: string | undefined;
  line: number;
}

interface PageSource {
  file: string;
  /** The path shown in failures, relative to the repository. */
  label: string;
  url: string;
  frontmatter: Frontmatter;
  body: string;
  bodyLine: number;
}

const failures: string[] = [];

function fail(label: string, rule: string, message: string) {
  failures.push(`${label}: [${rule}] ${message}`);
}

function readPage(file: string): PageSource {
  const absolute = join(pagesDirectory, file);
  const source = readFileSync(absolute, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);

  return {
    file,
    label: relative(repositoryDirectory, absolute),
    url: pageUrlOf(file),
    frontmatter: (match ? parseYaml(match[1]) : {}) as Frontmatter,
    body: match ? source.slice(match[0].length) : source,
    bodyLine: match ? match[0].split('\n').length : 1,
  };
}

/** The body with each fenced block replaced by blank lines, so headings and prose keep their line numbers. */
function withoutFences(body: string): string {
  return body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, block => block.replace(/[^\n]/g, ''));
}

function headingsOf(page: PageSource): Heading[] {
  return withoutFences(page.body)
    .split('\n')
    .flatMap((line, index) => {
      const match = /^(#{2,6})\s+(.*?)(?:\s+\[#([\w-]+)\])?\s*$/.exec(line);
      return match ? [{ depth: match[1].length, text: match[2], id: match[3], line: page.bodyLine + index }] : [];
    });
}

function checkHeadings(page: PageSource) {
  const { type } = page.frontmatter;
  const headings = headingsOf(page);
  const h2 = headings.filter(heading => heading.depth === 2);
  const fixed = new Set<Heading>();

  if (type === 'overview') {
    if (h2[0]?.text !== overviewHeadings.first)
      fail(page.label, 'fixed-headings', `the first H2 of an overview page must be "${overviewHeadings.first}"`);
    else fixed.add(h2[0]);

    const last = h2.at(-1);
    if (!last || last.text !== overviewHeadings.last || fixed.has(last))
      fail(page.label, 'fixed-headings', `the last H2 of an overview page must be "${overviewHeadings.last}"`);
    else fixed.add(last);
  } else {
    let position = 0;

    for (const expected of fixedHeadings[type]) {
      const optional = expected.endsWith('?');
      const text = optional ? expected.slice(0, -1) : expected;

      if (h2[position]?.text === text) {
        fixed.add(h2[position]);
        position += 1;
      } else if (!optional) {
        fail(
          page.label,
          'fixed-headings',
          `missing the fixed H2 "${text}" of type "${type}", in this place of the order`,
        );
      }
    }

    for (const extra of h2.slice(position))
      fail(
        `${page.label}:${extra.line}`,
        'fixed-headings',
        `H2 "${extra.text}" is not a fixed heading of type "${type}", or is out of order`,
      );
  }

  for (const heading of headings)
    if (!fixed.has(heading) && heading.id === undefined)
      fail(
        `${page.label}:${heading.line}`,
        'heading-id',
        `heading "${heading.text}" is not a fixed heading and needs an explicit id: "${'#'.repeat(heading.depth)} ${heading.text} [#id]"`,
      );
}

function checkCodeBlocks(page: PageSource) {
  const lines = page.body.split('\n');
  let index = 0;

  while (index < lines.length) {
    const open = /^(```|~~~)(\w+)?(.*)$/.exec(lines[index]);

    if (!open) {
      index += 1;
      continue;
    }

    const close = lines.findIndex((line, at) => at > index && line.startsWith(open[1]));
    const end = close === -1 ? lines.length : close;
    const [, , language = '', meta] = open;

    if (language === 'ts' || language === 'tsx')
      checkBlock(`${page.label}:${page.bodyLine + index}`, meta, lines.slice(index + 1, end).join('\n'));

    index = end + 1;
  }

  for (const include of page.body.matchAll(/<include([^>]*)>([^<]+)<\/include>/g)) {
    const [, attributes, target] = include;
    const path = join(dirname(join(pagesDirectory, page.file)), target.trim().split('#')[0]);

    if (!/\.tsx?$/.test(path)) continue;

    const line = page.bodyLine + page.body.slice(0, include.index).split('\n').length - 1;
    const meta = /meta=(["'])(.*?)\1/.exec(attributes)?.[2] ?? '';

    if (!existsSync(path)) {
      fail(
        `${page.label}:${line}`,
        'code-blocks',
        `the included file ${relative(repositoryDirectory, path)} does not exist`,
      );
      continue;
    }

    checkBlock(`${page.label}:${line}`, meta.replaceAll('\\"', '"'), readFileSync(path, 'utf8'));
  }
}

function checkBlock(label: string, meta: string, code: string) {
  const checked = /(^|\s)twoslash(\s|$)/.test(meta);
  const reason = /no-check=(["'])(.*?)\1/.exec(meta)?.[2]?.trim();

  if (!checked && !reason)
    fail(
      label,
      'code-blocks',
      'a ts or tsx block needs `twoslash`, or `no-check="<reason>"` when it cannot be checked',
    );

  if (!/from\s+['"]@oxform\//.test(code))
    fail(label, 'code-blocks', 'a ts or tsx block must import from an `@oxform/` entry point, so it stands alone');
}

function checkHiddenContent(page: PageSource, imageAllowlist: Set<string>) {
  page.body.split('\n').forEach((line, index) => {
    const label = `${page.label}:${page.bodyLine + index}`;

    if (line.includes('---cut'))
      fail(label, 'hidden-code', 'do not hide code with `---cut---`: the Markdown form must be the code that compiles');

    for (const image of line.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)|<img[^>]*src=["']([^"']+)["']/g)) {
      const source = image[1] ?? image[2];
      if (!imageAllowlist.has(source))
        fail(
          label,
          'images',
          `the image ${source} is not in apps/docs/scripts/image-allowlist.json. State its fact in text, then add it`,
        );
    }
  });
}

function checkTerms(page: PageSource) {
  for (const finding of findForbiddenTerms(page.body, { format: 'markdown', audience: 'public' }))
    fail(
      `${page.label}:${page.bodyLine + finding.line - 1}`,
      'terms',
      `forbidden term "${finding.term}", use ${finding.use}`,
    );
}

function knownExampleIds(): Set<string> {
  const ids = new Set<string>();

  for (const file of globSync(exampleSources, {
    cwd: repositoryDirectory,
    exclude: path => path.includes('node_modules'),
  })) {
    const text = readFileSync(join(repositoryDirectory, file), 'utf8');

    for (const [, from, to] of text.matchAll(/\bE(\d{2}) to E(\d{2})\b/g)) {
      for (let id = Number(from); id <= Number(to); id += 1) ids.add(`E${String(id).padStart(2, '0')}`);
    }
    for (const [id] of text.matchAll(/\bE\d{2}\b/g)) ids.add(id);
  }

  return ids;
}

function checkExamples(page: PageSource, known: Set<string>) {
  const { type, examples } = page.frontmatter;

  if (typesWithExamples.has(type) && examples.length === 0)
    fail(page.label, 'catalogue', `a ${type} page names at least one catalogue id in \`examples\``);

  for (const id of examples)
    if (!known.has(id))
      fail(page.label, 'catalogue', `example ${id} is not in the example kit or an example app (examples/*/src)`);
}

function camelCase(slug: string): string {
  return slug.replace(/-(\w)/g, (_match, letter: string) => letter.toUpperCase());
}

function inlineCodeNames(body: string): Set<string> {
  return new Set([...withoutFences(body).matchAll(/`([A-Za-z_$][\w$]*)(?:\([^`]*\))?`/g)].map(match => match[1]));
}

/**
 * Each reference page names an export of its entry point, by its slug or in inline code. Once a reference folder
 * has a page, each runtime export of its entry point has a page: a slug, or inline code on a page other than the
 * index. A folder with no page yet is not checked, so the folder's ticket writes its pages and exports together.
 */
async function checkInventory(pages: PageSource[]) {
  for (const [folder, entry] of Object.entries(referenceFolders)) {
    const folderPages = pages.filter(page => page.file.startsWith(`${folder}/`));
    if (folderPages.length === 0) continue;

    const exports = new Set(Object.keys(await import(entry)));
    const named = new Set<string>();

    for (const page of folderPages) {
      const slug = page.file.slice(folder.length + 1).replace(/\.mdx?$/, '');
      const names = inlineCodeNames(page.body);
      const isIndex = slug === 'index';

      if (!isIndex) {
        named.add(camelCase(slug));
        for (const name of names) named.add(name);
      }

      if (isIndex || inventoryExemptPages.has(page.file)) continue;
      if (!exports.has(camelCase(slug)) && ![...names].some(name => exports.has(name)))
        fail(page.label, 'inventory', `the page names no export of ${entry}, by its slug or in inline code`);
    }

    for (const name of exports)
      if (!named.has(name))
        fail(
          relative(repositoryDirectory, join(pagesDirectory, folder)),
          'inventory',
          `the export \`${name}\` of ${entry} has no page in ${folder}/`,
        );
  }
}

/** Pages written as `!name` in a `meta.json` are hidden from the sidebar, so the agent indexes leave them out. */
function hiddenPageFiles(): Set<string> {
  const hidden = new Set<string>();

  for (const metaFile of globSync('**/meta.json', { cwd: pagesDirectory })) {
    const folder = dirname(metaFile);
    const items: string[] = JSON.parse(readFileSync(join(pagesDirectory, metaFile), 'utf8')).pages ?? [];

    for (const item of items.filter(name => name.startsWith('!'))) {
      const base = folder === '.' ? item.slice(1) : `${folder}/${item.slice(1)}`;
      for (const candidate of [`${base}.mdx`, `${base}.md`, `${base}/index.mdx`]) hidden.add(candidate);
    }
  }

  return hidden;
}

function readOutput(path: string): string | undefined {
  const file = join(outputDirectory, path);
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

function checkOutputs(pages: PageSource[]) {
  const hidden = hiddenPageFiles();
  const listed = pages.filter(page => !hidden.has(page.file));
  const index = readOutput('llms.txt');
  const full = readOutput('llms-full.txt');

  for (const page of pages) {
    const markdown = readOutput(markdownUrlOf(page.url));
    if (!markdown?.trim())
      fail(
        page.label,
        'markdown-output',
        `no Markdown output at dist/client${markdownUrlOf(page.url)}, or it is empty`,
      );
  }

  if (index === undefined) fail('dist/client/llms.txt', 'llms-index', 'missing. Run `pnpm run docs:build` first');
  else {
    const links = [...index.matchAll(/\]\((\/[^)\s]*)\)/g)].map(match => match[1]);

    for (const link of links)
      if (readOutput(link) === undefined) fail('dist/client/llms.txt', 'llms-index', `the link ${link} is dead`);

    for (const page of listed) {
      const count = links.filter(link => link === markdownUrlOf(page.url)).length;
      if (count !== 1)
        fail(
          'dist/client/llms.txt',
          'llms-index',
          `${page.label} is listed ${count} times, expected once at ${markdownUrlOf(page.url)}. Is it in its meta.json?`,
        );
    }
  }

  if (full === undefined) fail('dist/client/llms-full.txt', 'llms-full', 'missing. Run `pnpm run docs:build` first');
  else
    for (const page of listed)
      if (!full.includes(`# ${page.frontmatter.title}\n`))
        fail('dist/client/llms-full.txt', 'llms-full', `the title of ${page.label} is missing`);
}

function outputHeadingIds(pages: PageSource[]): Record<string, string[]> {
  return Object.fromEntries(
    pages.map(page => {
      const markdown = withoutFences(readOutput(markdownUrlOf(page.url)) ?? '');
      return [page.url, [...markdown.matchAll(/^#{2,6} .*\[#([\w-]+)\]\s*$/gm)].map(match => match[1])];
    }),
  );
}

function checkHeadingIds(pages: PageSource[], record: boolean) {
  const committed: Record<string, string[]> = JSON.parse(readFileSync(headingIdsFile, 'utf8'));
  const current = outputHeadingIds(pages);
  const added: string[] = [];

  for (const [url, ids] of Object.entries(committed)) {
    const present = new Set(current[url] ?? []);
    for (const id of ids)
      if (!present.has(id))
        fail(
          `apps/docs/scripts/heading-ids.json`,
          'heading-ids',
          `the heading id ${url}#${id} was removed. Keep the id, or record the decision and a redirect note, then delete it from the list`,
        );
  }

  for (const [url, ids] of Object.entries(current))
    for (const id of ids)
      if (!committed[url]?.includes(id)) {
        added.push(`${url}#${id}`);
        if (record) (committed[url] ??= []).push(id);
      }

  if (record) {
    writeFileSync(headingIdsFile, `${JSON.stringify(committed, null, 2)}\n`);
    console.log(`Recorded ${added.length} heading id(s) in apps/docs/scripts/heading-ids.json.`);
  } else
    for (const id of added)
      fail(
        `apps/docs/scripts/heading-ids.json`,
        'heading-ids',
        `the heading id ${id} is not recorded. Run \`pnpm --dir apps/docs run check:agents --record-heading-ids\``,
      );
}

const pages = listPageFiles(appDirectory).map(readPage);
const templates = globSync('templates/*.mdx', { cwd: pagesDirectory }).map(readPage);
const imageAllowlist = new Set<string>(JSON.parse(readFileSync(imageAllowlistFile, 'utf8')));
const exampleIds = knownExampleIds();

for (const template of templates) checkHeadings(template);

for (const page of pages) {
  checkHeadings(page);
  checkCodeBlocks(page);
  checkHiddenContent(page, imageAllowlist);
  checkTerms(page);
  checkExamples(page, exampleIds);
}

await checkInventory(pages);
checkOutputs(pages);
checkHeadingIds(pages, process.argv.includes('--record-heading-ids'));

if (failures.length > 0) {
  console.error(failures.join('\n'));
  console.error(`\ndocs:check:agents: ${failures.length} failure(s) in ${pages.length} pages.`);
  process.exit(1);
}

console.log(`docs:check:agents: ${pages.length} pages and ${templates.length} templates pass.`);
