# Oxform Documentation Package Spec

Status: resolved

## Problem Statement

Oxform needs public-facing product documentation, but the repository currently only has maintainer-oriented development guides. A previous work-in-progress stash proves that Fumadocs can work for Oxform, but it was created as a `docs` workspace and that conflicts with the existing development-guide directory. The stash also predates the current workspace shape, package versions, and `vite-plus` command conventions.

The result is a useful but unsafe starting point: replaying the stash directly would mix public website concerns with repository-maintainer documentation, reintroduce stale workspace configuration, and make the docs package depend on incidental implementation details instead of Oxform's public package interfaces.

## Solution

Create a new private documentation application package for Oxform's public docs. The package should use Fumadocs for content, Fumadocs UI for documentation layout, TanStack Start for routing/server behavior, and the current monorepo tooling conventions for scripts and validation.

The existing development-guide directory remains in place as repo-maintainer documentation. The new docs app owns the public documentation website surface: landing page, docs routes, search, MDX rendering, code highlighting, type tables, and example-backed content.

The docs app should consume Oxform through the public package interfaces. Generated API reference pages and example snippets should import from the package exports that users see, not from internal source paths. This keeps the docs honest and makes the docs package a high-signal integration test for the published API.

## User Stories

1. As a prospective Oxform user, I want a public documentation website, so that I can understand what Oxform does before installing it.
2. As a React user, I want a getting-started path for Oxform React, so that I can build my first form quickly.
3. As a framework-agnostic user, I want core package documentation, so that I can understand the non-React form primitives.
4. As a TypeScript user, I want examples that preserve inferred types, so that I can trust Oxform's type-safety claims.
5. As a form-library evaluator, I want clear concepts and comparison material, so that I can decide whether Oxform fits my application.
6. As an Oxform user, I want validation documentation, so that I can wire Standard Schema validation correctly.
7. As an Oxform user, I want array-field documentation, so that I can manage dynamic lists without guessing API behavior.
8. As an Oxform user, I want subscription documentation, so that I can observe form state without unnecessary rendering.
9. As an Oxform user, I want API reference pages generated from public exports, so that the documentation matches the package I install.
10. As an Oxform user, I want examples for common form patterns, so that I can adapt known-good snippets to my app.
11. As an Oxform user, I want search, so that I can jump directly to an API, concept, or recipe.
12. As a docs reader, I want a stable left navigation and table of contents, so that large guides remain scannable.
13. As a docs reader, I want code blocks with useful highlighting, so that examples are readable.
14. As a docs reader, I want TypeScript hover/type examples where useful, so that type behavior is visible without running an editor.
15. As a maintainer, I want public docs separated from maintainer guides, so that website framework files do not clutter repository guidance.
16. As a maintainer, I want the docs app to be a private workspace package, so that it can have web-app dependencies without changing library publish surfaces.
17. As a maintainer, I want root workspace scripts for docs development and docs build, so that the docs app can be run predictably from the monorepo root.
18. As a maintainer, I want the docs package to follow existing package-manager conventions, so that Bun and Vite+ remain the standard workflow.
19. As a maintainer, I want docs dependencies isolated to the docs app where possible, so that library packages do not gain website-only dependencies.
20. As a maintainer, I want generated Fumadocs artifacts ignored, so that generated source files and build output do not pollute version control.
21. As a maintainer, I want docs examples to use public package exports, so that docs failures reveal real API problems.
22. As a maintainer, I want stale stash content refreshed during migration, so that old API names and old package versions do not become official documentation.
23. As a maintainer, I want the docs package type-checkable, so that MDX and example-code regressions are caught.
24. As a maintainer, I want the docs package buildable in CI later, so that the website can be deployed without special local steps.
25. As a maintainer, I want search to work from the same content source as pages, so that page titles and search results do not drift.
26. As a maintainer, I want Fumadocs/TanStack complexity hidden inside the docs app, so that the rest of the monorepo only needs a small package-script interface.
27. As a maintainer, I want the previous stash used as reference only, so that useful content is retained without copying obsolete scaffold decisions.
28. As a maintainer, I want the implementation split into small agent-ready tickets, so that a future agent can implement one vertical slice at a time.

## Implementation Decisions

- Add a new private public-docs application package instead of reusing the current development-guide directory.
- Keep the current development-guide directory for maintainer-facing repo documentation.
- Treat the previous Fumadocs stash as a design reference and content seed, not as a patch to apply.
- Use Fumadocs MDX as the content source for public docs pages and metadata.
- Use Fumadocs UI for documentation layout, docs page chrome, tabs, cards, type tables, and MDX defaults.
- Use TanStack Start for the docs application routing and server route support.
- Keep the docs app's external interface small: root scripts for development, build, type-checking, and start.
- Keep Fumadocs, TanStack Start, Tailwind, search, and MDX implementation details inside the docs application.
- Use the current workspace style rather than the stash's older workspace-object and `bun --filter` script shape.
- Add the new app workspace without changing publishable library package surfaces.
- Import Oxform examples and API reference symbols from public package exports.
- Do not document internals as public API.
- Prefer docs examples that can be type-checked by the docs app.
- Use generated type tables where they improve accuracy, but do not make prose pages unreadable.
- Add a small public landing page, but make documentation access the primary action.
- Include a first complete docs path before broad content migration, so the package is useful early.
- Keep search backed by the Fumadocs source.
- Add generated build/source output to ignore rules.
- Keep package release commands focused on library release unless a later decision explicitly makes docs build a release gate.

## Testing Decisions

- The highest test seam is the docs package script interface: type-check, production build, and local dev server.
- Type-checking should cover the docs app, MDX-generated types, and example/type-table entrypoints.
- The first implementation slice should verify that the docs app starts and renders a page.
- Search should be verified through its route or handler once content source wiring exists.
- API-reference examples should be verified by importing from public Oxform package exports.
- Migration tickets should include a stale-content pass against current package exports before considering pages accepted.
- Build verification should run after Fumadocs source generation, route generation, and content migration.
- Visual/browser verification is useful once a dev server can run, but the first acceptance gate is a successful build and type-check.
- Do not test Fumadocs internals. Test Oxform's docs package as a user of Fumadocs through its scripts and rendered routes.

## Out of Scope

- No changes to Oxform public APIs unless documentation reveals a real API defect that gets handled in a separate feature.
- No removal or replacement of the existing maintainer documentation.
- No deployment platform setup.
- No production domain, analytics, SEO campaign, or marketing funnel work.
- No full visual brand system beyond a competent initial docs UI.
- No guarantee that every API is fully documented in the first implementation pass.
- No automated API extraction system beyond the Fumadocs type-table flow needed for this docs package.
- No package release or publish workflow changes unless explicitly requested later.

## Further Notes

The main module seam is the docs application package. Its interface to the rest of the monorepo is intentionally small: scripts and workspace membership. Inside that package, Fumadocs owns content compilation, TanStack Start owns routing/server behavior, and Oxform package exports provide the examples and API reference surface.

The previous stash is most useful for page inventory, Fumadocs/TanStack route shape, MDX component setup, search route shape, and early React documentation content. It should not dictate the final package location, workspace syntax, dependency versions, or API wording.
