# Solid 2 example

Run from the repository root:

```bash
pnpm --dir examples/solid-v2 run dev
```

This local demo exercises [@oxform/solid/v2](../../packages/solid/readme.md#solid-2)
with Solid `2.0.0-rc.19` and `@solidjs/vite-plugin` `3.0.0-next.51`.
Enter a name, email, and member name, then save. Non-company email addresses
produce a non-blocking warning. Add, move, and remove members to exercise keyed
field rebinding. The checkbox uses an explicit boolean handler. Observed state
shows the selected values and the last email change received by a form effect.
Form effects observe committed changes after Solid's flush.
Reset restores the initial values and clears submission feedback.
