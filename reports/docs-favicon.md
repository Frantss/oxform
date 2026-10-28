# Docs favicon request

## 2026-10-23

- `apps/docs/src/routes/__root.tsx:24` declares a stylesheet without an icon link. Loading the docs dev server caused a request to `/favicon.ico` that returned HTTP 404 and produced a browser console error. No hydration errors were observed during the package migration checks.
