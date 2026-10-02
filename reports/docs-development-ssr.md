# Documentation development SSR

- `apps/docs/src/routes/__root.tsx:44` wraps the site with Fumadocs's TanStack
  `RootProvider`. On the first homepage load after starting the development
  server, SearchDialog and LinkItem nevertheless reported
  `You need to wrap your application inside FrameworkProvider`. React switched
  those boundaries to client rendering. Production preview SSR and subsequent
  development React-page loads did not show this error. It matters for cold
  development-server SSR and hydration verification; the cause is unconfirmed.

- `apps/docs/src/routes/__root.tsx:24` declares a stylesheet link but no favicon.
  Requests for `/favicon.ico` returned 404 in both development and production
  preview, adding a resource error to otherwise successful browser checks.
