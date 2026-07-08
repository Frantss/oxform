# Add Public API Reference Pipeline

Status: resolved
Blocked by: 02 - Wire Fumadocs Content, Layout, And Search

## Parent

`.scratch/oxform-docs-package/SPEC.md`

## What to build

Add the API-reference path that documents public Oxform exports through generated type tables and TypeScript-aware examples, starting with one complete React API page as the proof of the pipeline.

## Acceptance criteria

- [x] API reference pages import documented symbols from public Oxform package exports.
- [x] The docs app can render a type table for at least one public React API.
- [x] TypeScript/twoslash examples run against the public docs package TypeScript configuration.
- [x] The first API page is corrected against the current package API instead of copying stale stash prose.
- [x] The API-reference pipeline is documented enough for later pages to follow the same pattern.
- [x] Docs type-check catches broken public-export imports.

## Blocked by

- 02 - Wire Fumadocs Content, Layout, And Search.
