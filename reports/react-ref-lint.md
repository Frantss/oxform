# React ref lint warnings

## 2026-10-02

`pnpm run check:all` reports `react/refs` warnings at
`packages/react/src/use-form-effect.ts:13`, `:14`, and `:16`,
`packages/react/src/tests/use-field.spec.tsx:42`, and
`packages/react/src/tests/issues.spec.tsx:77`. The warnings concern ref reads
during render, which can prevent updates from being reflected in a component.
They are existing warnings outside the Solid 2 adapter work; the lint command
does not fail on them.
