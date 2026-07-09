# Create/Use API Type Tests Spec

Status: ready-for-agent

## Problem Statement

Oxform's value proposition depends on schema-driven TypeScript inference. A user should be able to pass a form schema to a `create*` or `use*` API and trust that every related configuration parameter, field name, selector, callback store, and return value is typed from that schema.

The current tests cover important parts of this behavior, but the coverage is uneven across the public `create*` and `use*` surfaces. This makes future type refactors risky: a change can preserve runtime behavior while silently widening a field path, losing a nested value type, accepting an invalid array field name, or returning a less specific API type.

The missing guarantee is a complete compile-time safety net for public creation and hook APIs.

## Solution

Add focused type tests for every public `create*` and `use*` API whose configuration or return type depends on a form's inferred values. These tests should prove that each API accepts only schema-valid configuration, exposes the correct return type, and preserves inference through nested objects, arrays, field paths, field values, selectors, callbacks, and issue levels where applicable.

The tests should use Oxform's existing type assertion style and should live at the same public seams a user calls: form creation, field creation, array field creation, effects/subscriptions, React hooks, and generated form hooks if they are exported or intended to be exported. The goal is not to test implementation details; it is to lock down the public type contract.

## User Stories

1. As a TypeScript user, I want `createForm` options to infer values from the schema, so that default values and callback stores are typed without manual annotations.
2. As a TypeScript user, I want `createForm` to reject default values that do not match the schema, so that schema and initial state cannot drift.
3. As a TypeScript user, I want `createForm` to return a form API typed by the schema values, so that field reads, changes, validation, submit callbacks, and status access stay precise.
4. As a TypeScript user, I want nested object paths inferred from the schema, so that field APIs can target nested fields safely.
5. As a TypeScript user, I want array item paths inferred from the schema, so that array item reads and nested array field reads retain the right value type.
6. As a TypeScript user, I want invalid field paths rejected by create and hook APIs, so that typos fail at compile time.
7. As a TypeScript user, I want non-array field paths rejected by array-field APIs, so that array-only operations cannot be configured against scalar fields.
8. As a TypeScript user, I want `createField` options to infer the allowed name from the form, so that only fields from the schema can be created.
9. As a TypeScript user, I want `createField` to return a field API whose value type matches the selected field, so that `state.value`, `change`, `reset`, `props`, and issue reads stay type-safe.
10. As a TypeScript user, I want `createArrayField` options to infer the allowed name from the form, so that only array fields from the schema can be created.
11. As a TypeScript user, I want `createArrayField` to return an array field API whose item and list operations match the selected array value, so that append, insert, update, replace, move, and remove are type-safe.
12. As a TypeScript user, I want `createEffect` selectors to receive the form-like store state typed by the schema, so that selected values retain their exact type.
13. As a TypeScript user, I want `createEffect` callbacks to receive the selector result type, so that effect code cannot accidentally handle the wrong state shape.
14. As a React user, I want `useForm` options to infer values from the schema the same way `createForm` does, so that React forms do not require duplicate value types.
15. As a React user, I want `useForm` to return a form API typed by the schema values, so that React code gets the same field and submit typing as core code.
16. As a React user, I want `useField` options to accept only valid field names from the provided form, so that component field bindings cannot point to unknown fields.
17. As a React user, I want `useField` to return state and props typed from the selected field, so that controlled input code gets the correct value type.
18. As a React user, I want `useFieldApi` to return the same schema-specific field API as `createField`, so that hook-only and non-hook usage stay consistent.
19. As a React user, I want `useArrayField` options to accept only valid array field names, so that array UI bindings cannot be configured against scalar fields.
20. As a React user, I want `useArrayField` to return an array API typed from the selected schema array, so that list UI operations are type-safe.
21. As a React user, I want `useFormStatus` to preserve the issue-level type from the form, so that status typing does not widen when consumed through React.
22. As a React user, I want `useFormEffect` selectors and callbacks to preserve schema-driven state types, so that React side effects remain typed like core effects.
23. As a React user, I want `useSubscribe` selectors to preserve schema-driven selected state, so that subscription results are not widened to `unknown` or `any`.
24. As a React user, I want generated hooks from the form-definition helper to preserve schema-derived values, field names, array names, and issue levels, so that helper-based usage is not less type-safe than direct hook usage.
25. As a maintainer, I want the type tests to cover every exported public API with a `create*` or `use*` name, so that additions to the public surface do not skip inference coverage.
26. As a maintainer, I want implementation-only utilities with `create` or `use` prefixes excluded from this requirement, so that tests focus on user-facing contracts.
27. As a maintainer, I want the tests to catch widening to `any`, `unknown`, broad `string`, or broad array types, so that inference regressions are visible during type checking.
28. As a maintainer, I want negative tests for invalid config where meaningful, so that APIs are proven to reject unsafe usage rather than only type happy paths.
29. As a maintainer, I want the tests to reuse a small representative schema, so that the suite is readable and easy to update.
30. As a maintainer, I want the root type-check to be the acceptance gate, so that core, React, examples, and generated declarations agree on the public API contract.

## Implementation Decisions

- Treat this as a compile-time contract feature, not a runtime behavior change.
- Cover the public core creation APIs: form creation, field creation, array field creation, and effect creation.
- Cover the public React hook APIs: form, field, field API, array field, form status, form effect, and subscription hooks.
- Cover helper-generated hooks if the helper is exported or intended to be part of the public React API. If it is not public, the implementation should explicitly decide whether to export it or leave it out of the public-surface checklist.
- Define a public-surface inventory before adding tests. The inventory should come from package exports, not from broad source-file naming.
- Use one representative schema that includes scalar fields, nested object fields, arrays of scalars, arrays of objects, and nested array-object fields.
- Assert both the input side and output side of each API. Input-side assertions should cover accepted config, rejected config, selector parameter types, callback parameter types, and invalid field names. Output-side assertions should cover returned API types, state values, props values, selected values, field operations, array operations, validation results, and submit callback parameters where applicable.
- Preserve the existing checks/issues inference expectations while doing this work. Issue-level tests are not the primary purpose of this spec, but APIs that already propagate issue levels must keep doing so.
- Prefer `expectTypeOf` for positive assertions and `@ts-expect-error` for negative assertions, matching current test style.
- Avoid introducing a separate type-test runner unless the current test harness cannot express the required assertions.
- Do not change public type names or API signatures solely to make tests easier.
- If a public API cannot currently express the intended schema inference, fix the real type boundary rather than adding casts in tests.
- Keep casts out of the assertions except where an existing test harness requires unavoidable setup. Any unavoidable cast should sit at setup boundaries, not at the assertion being proven.
- Keep test cases organized by API surface so future public exports can be checked against a clear matrix.

## Testing Decisions

- The highest seam for this work is the public package export surface. Tests should exercise APIs as package users would call them.
- Core tests should prove schema inference through form creation, field creation, array field creation, and effect creation.
- React tests should prove schema inference through direct hooks and any public helper-generated hooks.
- Good tests assert external type behavior: what configuration is accepted or rejected, what a callback receives, and what a returned API exposes. They should not assert private generic helper mechanics.
- Positive tests should use exact type assertions for representative paths: scalar, nested object, scalar array, array item, object array item, and nested object array item.
- Negative tests should use `@ts-expect-error` for invalid field names, scalar names passed to array APIs, wrong default value shapes, wrong field value writes, and callback assumptions that contradict the schema.
- Selector/effect tests should assert both selector input state and callback selected-state output.
- Field return tests should assert `state.value`, `state.defaultValue`, write/update methods, issue reads, and React `props.value` where available.
- Array field return tests should assert list value type and operation argument types.
- Form return tests should assert field-path methods, array-path methods, validation result type, submit success values, submit error issues, and option update typing.
- Status tests should assert that React status hooks preserve any issue-level generic exposed by form status.
- The initial acceptance gate is the relevant package test files plus the root type-check.
- If public declaration output affects downstream package checks, rebuild the core package before running the root type-check.

## Out of Scope

- No runtime behavior changes unless needed to support a type-boundary fix.
- No redesign of form, field, array field, effect, or React hook APIs.
- No migration from Standard Schema to a different schema abstraction.
- No new validation/checks/issues feature work.
- No broad documentation rewrite, except for a small note if the public API inventory reveals an exported helper is missing from docs.
- No package release or publish work.
- No requirement to test implementation-only helpers that are not exported from public packages.

## Further Notes

This spec intentionally uses the phrase "public `create*` and `use*` APIs" rather than "all source files whose names start with create or use." The test inventory should be derived from package exports. Internal utilities can keep their existing local tests, but the required schema-inference matrix belongs at the user-facing API boundary.

The most important failure mode to guard against is silent widening. A test that proves a field path is `string` is not enough; the tests should prove that valid paths are specific, invalid paths are rejected, and selected/returned values match the exact schema-derived type.
