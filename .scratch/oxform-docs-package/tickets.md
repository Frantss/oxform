# Tickets: Oxform Documentation Package

These tickets build the public Fumadocs-based documentation package described in `SPEC.md` while preserving the existing maintainer documentation directory.

Work the frontier: any ticket whose blockers are all done. The first two tickets establish the app and content source; later tickets can branch where their blockers are satisfied.

## 01 - Establish Public Docs App Package

**What to build:** Add a private public-docs workspace package with the current monorepo command conventions, a runnable TanStack Start shell, and a minimal Oxform landing/docs entry route. The existing maintainer documentation remains separate.

**Blocked by:** None - can start immediately.

- [x] The new docs app is a private workspace package.
- [x] Root scripts can run the docs app in development, build it, and type-check it.
- [x] Existing maintainer documentation remains in place and is not converted into app source.
- [x] The app renders a minimal Oxform page through TanStack Start.
- [x] Generated app output is ignored by version control.
- [x] The app package does not change publishable library package surfaces.

## 02 - Wire Fumadocs Content, Layout, And Search

**What to build:** Turn the shell into a real documentation app by wiring Fumadocs MDX collections, Fumadocs UI layout, docs routes, metadata navigation, MDX components, and search over the content source.

**Blocked by:** 01 - Establish Public Docs App Package.

- [x] The docs app has a Fumadocs MDX content source.
- [x] The docs route renders MDX pages with a docs layout, navigation tree, title, description, body, and table of contents.
- [x] The root docs page leads to initial Core and React sections.
- [x] Search is backed by the same docs content source.
- [x] Tabs, cards, and default MDX components render inside docs pages.
- [x] Type-checking covers generated Fumadocs collection imports.

## 03 - Add Public API Reference Pipeline

**What to build:** Add the API-reference path that documents public Oxform exports through generated type tables and TypeScript-aware examples, starting with one complete React API page as the proof of the pipeline.

**Blocked by:** 02 - Wire Fumadocs Content, Layout, And Search.

- [x] API reference pages import documented symbols from public Oxform package exports.
- [x] The docs app can render a type table for at least one public React API.
- [x] TypeScript/twoslash examples run against the public docs package TypeScript configuration.
- [x] The first API page is corrected against the current package API instead of copying stale stash prose.
- [x] The API-reference pipeline is documented enough for later pages to follow the same pattern.
- [x] Docs type-check catches broken public-export imports.

## 04 - Migrate And Refresh Core React Guide Content

**What to build:** Migrate the useful guide content from the stash into the new docs app, refresh it against current Oxform APIs, and produce a coherent React guide path from installation to validation and subscriptions.

**Blocked by:** 02 - Wire Fumadocs Content, Layout, And Search; 03 - Add Public API Reference Pipeline.

- [x] React getting-started content uses current package names, current APIs, and public imports.
- [x] Validation guidance explains Standard Schema usage without coupling to internal implementation.
- [x] Concepts and TypeScript guidance reflect the current form, field, array-field, and subscription model.
- [x] Guide pages link to the API reference where appropriate.
- [x] Stale stash API names and stale package-manager instructions are removed.
- [x] The migrated pages type-check and build with the docs app.

## 05 - Add Example-Backed Recipes

**What to build:** Add recipe pages that use small, realistic Oxform examples and align with the existing example app where useful, so readers can move from guide prose to working patterns.

**Blocked by:** 04 - Migrate And Refresh Core React Guide Content.

- [x] Recipe pages cover at least basic form submit, validation feedback, array fields, subscriptions, and async/effect-oriented flows.
- [x] Snippets use public package exports and current Oxform idioms.
- [x] Recipes avoid documenting internal state or source-only helpers.
- [x] Links connect recipes back to the relevant guide and API pages.
- [x] Examples are small enough to read in docs but complete enough to adapt.
- [x] The docs app type-checks and builds with the recipe content.

## 06 - Verify Integration And Prepare For Implementation Handoff

**What to build:** Finish the first public-docs milestone by running the docs app verification path, cleaning up generated artifacts, and documenting how future agents should continue the docs package.

**Blocked by:** 05 - Add Example-Backed Recipes.

- [x] The docs app type-check passes from the root script.
- [x] The docs app production build passes.
- [x] Search route or handler is verified against indexed content.
- [x] A local dev run is smoke-tested in a browser or equivalent route check.
- [x] Generated files and build output are either committed intentionally or ignored intentionally.
- [x] Follow-up content gaps are recorded without blocking the initial docs package.
