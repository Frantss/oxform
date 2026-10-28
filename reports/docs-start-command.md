# Docs production start command

## 2026-10-23

- `apps/docs/package.json:10` starts `.output/server/index.mjs`. After a successful `pnpm run build`, the docs output is `apps/docs/dist/server/server.js`; the configured start target is absent. Starting the configured target fails with `MODULE_NOT_FOUND`, so the documented production start command cannot launch this build.
