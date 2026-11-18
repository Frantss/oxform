# Fumadocs Twoslash

## 2026-10-02

- `apps/docs/source.config.ts:30` supplies the numeric compiler option `jsx: 4` to
  `fumadocs-twoslash@4.0.1`. This version writes compiler options into a virtual
  `tsconfig.json`, where `jsx` must be a string. An uncached docs build fails in
  nine MDX files with `Compiler option 'jsx' requires a value of type enum.`
  The setting was already present before the pnpm migration. The libraries,
  React example, type checks, package checks, and 436 browser tests pass.

## 2026-11-18

- `fumadocs-twoslash@4.0.4` checks a block included with `<include meta="twoslash">file.ts</include>`: a
  type error in the included file fails `pnpm run docs:build` (`04-documentation.md#8`). A kit file with a
  relative import fails with error 2307, for example `examples/kit/src/sign-in.ts` (`./schemas/sign-in`),
  because the Twoslash file has no neighbours. Such a block takes `no-check="checked in the example kit"`,
  or includes a region that imports only `@oxform/*`.
- The processed Markdown (`includeProcessedMarkdown`, `remark-llms`) keeps the authored Twoslash notations:
  `// ^?` and `// @errors: 2769` stay in `/docs/<slug>.md`, and the fence keeps its `twoslash` meta
  (`04-documentation.md#7.2`, item 2).
