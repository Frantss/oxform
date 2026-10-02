# Solid example

Run from the repository root:

```bash
pnpm --dir examples/solid run dev
```

This local demo exercises [oxform-solid](../../packages/solid/readme.md).
Enter a name, email, and member name, then save. Non-company email addresses
produce a non-blocking warning. Add, move, and remove members to exercise keyed
field rebinding. The checkbox uses an explicit boolean handler. Observed state
shows the selected values and the last email change received by a form effect.
Reset restores the initial values and clears submission feedback.
