# Establish Public Docs App Package

Status: resolved
Blocked by: None

## Parent

`.scratch/oxform-docs-package/SPEC.md`

## What to build

Add a private public-docs workspace package with the current monorepo command conventions, a runnable TanStack Start shell, and a minimal Oxform landing/docs entry route. The existing maintainer documentation remains separate.

## Acceptance criteria

- [x] The new docs app is a private workspace package.
- [x] Root scripts can run the docs app in development, build it, and type-check it.
- [x] Existing maintainer documentation remains in place and is not converted into app source.
- [x] The app renders a minimal Oxform page through TanStack Start.
- [x] Generated app output is ignored by version control.
- [x] The app package does not change publishable library package surfaces.

## Blocked by

- None - can start immediately.
