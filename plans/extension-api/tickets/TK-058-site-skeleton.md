---
id: TK-058
title: Site skeleton
phase: 8
work_package: P8-01
status: done
depends_on: [TK-002]
branch: codex/P8-01-site-skeleton
pr: null
started: 2026-11-18
completed: 2026-11-18
---

# TK-058: Site skeleton

## Outcome

The docs site has one tree with the sections of the site map, a required frontmatter schema and one empty
template per page type. The old roots `/docs/react`, `/docs/solid` and `/docs/core` redirect to the
introduction. `pnpm run docs:build` passes.

## Scope

- In: the folders of `04-documentation.md#5` under `apps/docs/content/docs/`, each with a `meta.json` (`title`
  and an ordered `pages` list). The root `meta.json` with the sections in the order of `04#3`, written as
  separators (`---Main APIs---`), and no `root: true` folder. The frontmatter schema of `04#6` in
  `apps/docs/source.config.ts`, with every field required. One empty template per page type of `04#6`, with
  its fixed H2 headings in order. The single-tree layout in `apps/docs/src/routes/docs.$.tsx`. The three
  redirects. The health check line in `apps/docs/README.md` (`04#3`, line 90).
- Out: the old docs content, which TK-002 deleted. `llms.txt`, the `.md` route, page actions and
  `docs:check:agents` (TK-059). Page content (TK-060 to TK-068). The rest of `apps/docs/README.md` (TK-067).

## Read first

- `04-documentation.md#3`: the decided organisation, the redirects and the health check path.
- `04-documentation.md#5`: the site map, the folders and the page list.
- `04-documentation.md#6`: the frontmatter fields, the page types and their fixed H2 headings.
- `04-documentation.md#10`: step 1, and the rule that step 4 pages are hidden from the sidebar until step 7.
- `apps/docs/README.md`: today's build, prerender and production setup.

## Decisions to apply

- D38: organise the site by concept and entry point (approach A of `04#3`). One tree, one sidebar.

## Acceptance

- [x] The root `meta.json` lists the sections in the order of `04#3`. No folder has `root: true`.
- [x] A page with a missing frontmatter field fails `pnpm run docs:build`.
- [x] `/docs/react`, `/docs/solid` and `/docs/core` redirect to the introduction, on the srvx server
      (`pnpm run docs:start`).
- [x] `apps/docs/README.md` names the new health check path.
- [x] `pnpm run docs:build` and `pnpm run check:format` pass.
- [x] The sidebar and the redirects work at desktop and mobile sizes. The console shows no runtime, SSR or
      hydration error (`AGENTS.md`, "Validation").

## Evidence

Implementation commit: `a629541`.

- Tree: `apps/docs/content/docs/meta.json` lists `---Start---` and its five pages, then one separator and one
  extracted folder (`...core`) per section, in the order of `04#3`. Each of the nine folders has a `meta.json`
  with `title` and the ordered page names of `04#5` (72 pages in all). `grep -rn '"root"'
  apps/docs/content/docs` finds nothing. The sidebar shows the separators as section labels, with no extra
  folder level. A name in `pages` with no file yet is skipped by the loader, so each later ticket adds only the
  `.mdx` file.
- Schema: `apps/docs/source.config.ts` extends `pageSchema` with `description`, `type` (the seven page types),
  `entry` (the seven entry points of `00-direction.md#Packages and entry points`), `principles` (`composable`,
  `reusable`, `extensible`, `type-safe`, `lightweight`) and `examples` (`E` and two digits). Each field is
  required. A list can be empty, because some pages have no entry point, principle or example (`04#5`).
- Planted fault: `concepts/planted-fault.mdx`, the concept template without `type`. `pnpm run docs:build` exited
  1 with `[MDX] invalid frontmatter in .../concepts/planted-fault.mdx: type: Invalid option: expected one of
  "concept"|...|"overview"`. The file was removed after.
- Templates: `apps/docs/content/docs/templates/<type>.mdx`, one per page type (concept, guide, reference,
  extension, recipe, adapter, overview), with the complete frontmatter and the fixed H2 headings of `04#6` in
  order. An MDX comment marks each optional heading. The `files` option of the collection globs only the root
  pages and the nine section folders, so the templates are not pages: `/docs/templates/concept` returns 404 and
  search does not index them. Check: all seven templates copied into `recipes/` and listed in its `meta.json`
  built and prerendered with `pnpm run docs:build`. The copies were removed after.
- Hiding: a `!` before a name in a `pages` list hides that page from the sidebar and keeps its place in the
  order (`fumadocs-core/dist/dynamic-CymQi8F2.js:354`). The page still builds and has its URL. To unhide in
  step 7, remove the `!`. Hidden now: `choose-an-api`, `limits` and the eight `concepts/*` pages. Check with
  `vp dev --port 3111` and a probe file at `concepts/forms-and-chains.mdx`: with `!` the page returned 200 and
  was not in the sidebar; without `!` it was in the sidebar. The probe was removed and the `!` restored.
- Redirects: `apps/docs/src/routes/docs.$.tsx` redirects `/docs/react`, `/docs/solid` and `/docs/core` to
  `/docs` (307) when no page has that path. `src/components/not-found.tsx` now links to `/docs`, not
  `/docs/react`. On `PORT=3110 pnpm run docs:start`: the three old roots returned 307 to `/docs`; `/docs`,
  `/playground` and `/api/search?query=oxform` returned 200; `/docs/nope` returned 404.
- Single-tree layout: `docs.$.tsx` already renders one `DocsLayout` with `source.getPageTree()` (TK-002), so it
  needed no change for the tree.
- `apps/docs/README.md`: the health check is `/docs`.
- Browser check (Playwright, production server, 1280x800 and 390x844): the sidebar shows the ten section labels
  and the introduction (mobile through the sidebar button). The three old roots end on `/docs` both by full
  load and by client navigation (`router.navigate`). No console error or warning, no page error, no hydration
  warning. Screenshots: `desktop-docs-sidebar.png`, `mobile-docs-sidebar.png`, `desktop-after-redirect.png`,
  `mobile-after-redirect.png` in the session scratchpad (`tk-058/`).
- Commands, from the repository root: `pnpm run build` (12/12 tasks passed, prerender `/`, `/playground`,
  `/docs`), `pnpm run docs:build` (passed), `pnpm run check:format` (passed), `pnpm run check:all` (passed).

Decisions (owner decision 18):

- `/docs/core` is also the URL of `core/index.mdx` (`04#5`). The redirect applies only while no page has the
  path, so it ends when `core/index.mdx` is written. The status is 307, not 301, so that no browser keeps the
  redirect after that.
- `index` stays visible, though step 4 writes it. It is the introduction, the target of the redirects and the
  only page today. Hiding it would leave a sidebar with no page.
- The `core/` list of the sidebar does not link to `behaviors/scope` yet (`04#5`). The link is added with the
  page, so that the sidebar has no dead link.
- `principles` uses the full names, not the letters of the site map.
- Section labels with no page yet show with nothing under them until their pages are written.
- Not measured: the plan asks for sizes on `compose/index`, `quick-start` and `presets/standard`. TK-033 is
  dropped, so the templates carry no size field and no size is recorded.
