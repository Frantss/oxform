# Migrate And Refresh Core React Guide Content

Status: resolved
Blocked by: 02 - Wire Fumadocs Content, Layout, And Search; 03 - Add Public API Reference Pipeline

## Parent

`.scratch/oxform-docs-package/SPEC.md`

## What to build

Migrate the useful guide content from the stash into the new docs app, refresh it against current Oxform APIs, and produce a coherent React guide path from installation to validation and subscriptions.

## Acceptance criteria

- [x] React getting-started content uses current package names, current APIs, and public imports.
- [x] Validation guidance explains Standard Schema usage without coupling to internal implementation.
- [x] Concepts and TypeScript guidance reflect the current form, field, array-field, and subscription model.
- [x] Guide pages link to the API reference where appropriate.
- [x] Stale stash API names and stale package-manager instructions are removed.
- [x] The migrated pages type-check and build with the docs app.

## Blocked by

- 02 - Wire Fumadocs Content, Layout, And Search.
- 03 - Add Public API Reference Pipeline.
