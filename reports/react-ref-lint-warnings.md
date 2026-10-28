# React ref lint warnings

## 2026-10-23

- `packages/react/src/use-form-effect.ts:13`, `:14`, and `:16` emit `react(refs)` warnings about ref access during render. The warnings identify a potential rendering consistency risk; `pnpm run check:all` still exits successfully.
- `packages/react/src/tests/use-field.spec.tsx:42` emits two `react(refs)` warnings, and `packages/react/src/tests/issues.spec.tsx:77` emits one. These warnings add noise to the release checks; the affected tests passed.
