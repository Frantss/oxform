# TK-009: Inert `api(ctx)` for server rendering

Checks Server rendering rules 1, 2 and 8 at the kernel level, without an adapter.

**Dependencies:** TK-005.

**Maps to:**

- Kernel tests run in Node with no `window`.
- Two concurrent instances of one definition share no state.
- `validation.run()` works with no DOM.

**Excluded:** `renderToString`, hydration, `useSelector` and `Root form={form}`. These need an
adapter and belong to Plan step 6.
