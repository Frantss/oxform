# Fumadocs function tables

- `apps/docs/content/docs/react/api/use-form/index.mdx:145` passes the callable
  export `useForm` to `auto-type-table`. The installed
  `fumadocs-typescript@5.4.1` generates object-property entries, leaving only
  an empty table header for callable exports. The same pattern occurs on other
  React API pages, so those tables do not display the documented function
  parameters or return types. Observed while adding Solid API tables.

- `apps/docs/source.config.ts:17` uses `remarkAutoTypeTable` with its default
  `remarkStringify: true`. Searching `createField` displays serialized generated
  TypeTable JSON as some result excerpts, alongside valid Solid page results.
  This exposes generated type-table data in search results instead of readable
  API text. The default also applies to the existing React and Core tables.
