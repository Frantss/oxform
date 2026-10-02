# Fumadocs Twoslash

## 2026-10-02

- `apps/docs/source.config.ts:30` supplies the numeric compiler option `jsx: 4` to
  `fumadocs-twoslash@4.0.1`. This version writes compiler options into a virtual
  `tsconfig.json`, where `jsx` must be a string. An uncached docs build fails in
  nine MDX files with `Compiler option 'jsx' requires a value of type enum.`
  The setting was already present before the pnpm migration. The libraries,
  React example, type checks, package checks, and 436 browser tests pass.
