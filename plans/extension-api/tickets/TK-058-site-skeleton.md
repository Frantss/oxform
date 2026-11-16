---
id: TK-058
title: Site skeleton
phase: 8
work_package: P8-01
status: todo
depends_on: [TK-002]
branch: codex/P8-01-site-skeleton
pr: null
started: null
completed: null
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

- [ ] The root `meta.json` lists the sections in the order of `04#3`. No folder has `root: true`.
- [ ] A page with a missing frontmatter field fails `pnpm run docs:build`.
- [ ] `/docs/react`, `/docs/solid` and `/docs/core` redirect to the introduction, on the srvx server
      (`pnpm run docs:start`).
- [ ] `apps/docs/README.md` names the new health check path.
- [ ] `pnpm run docs:build` and `pnpm run check:format` pass.
- [ ] The sidebar and the redirects work at desktop and mobile sizes. The console shows no runtime, SSR or
      hydration error (`AGENTS.md`, "Validation").

## Evidence

Record the command results, the browser check and any deviation from the plan here.
