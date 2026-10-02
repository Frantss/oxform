# Documentation Build

- `apps/docs/source.config.ts:30`: Twoslash receives the numeric compiler option
  `jsx: 4`. The installed Twoslash compiler-options parser rejects it with
  `Compiler option 'jsx' requires a value of type enum.` This prevents the
  documentation production build from compiling typed code examples. Observed
  while verifying the public API documentation revision with `bun run docs:build`.

- The JSX setting was corrected to `react-jsx` while starting the documentation
  server. The form API page subsequently returned HTTP 200 on localhost:3002.
  The production build has not been rerun since this correction.

- Production verification before committing passed after allowing the local
  preview port required by prerendering. The build compiled the documentation
  and prerendered all 18 pages. The earlier JSX error is resolved.
