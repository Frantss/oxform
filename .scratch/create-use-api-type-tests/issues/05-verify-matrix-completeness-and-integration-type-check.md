# Verify Matrix Completeness And Integration Type Check

Status: resolved
Blocked by: 02, 03, 04

## Parent

`.scratch/create-use-api-type-tests/SPEC.md`

## What to build

Finish the coverage pass by checking the public inventory against the test matrix, removing any accidental casts from assertions, and running the integration verification needed for schema-inference contracts across core and React.

## Acceptance criteria

- [x] Every public schema-dependent `create*` API has input-side and output-side type coverage.
- [x] Every public schema-dependent `use*` API has input-side and output-side type coverage.
- [x] Negative tests cover invalid field paths, scalar paths passed to array APIs, wrong default value shapes, wrong field writes, and callback assumptions that contradict the schema.
- [x] Assertions prove exact schema-derived types rather than broad `string`, `unknown`, `any`, or unspecific arrays.
- [x] Test setup avoids casts at the assertion boundary.
- [x] The relevant package test files pass.
- [x] Core package declarations are rebuilt first if downstream package checks depend on changed public core types.
- [x] The root type-check passes as the integration floor.

## Answer

Verified the matrix with targeted core and React test files, rebuilt core declarations, ran the root type-check, and ran the full root test suite with local socket permissions.

## Blocked by

- 02 - Cover Core Field, Array Field, And Effect Creation APIs.
- 03 - Cover Direct React Hook Type Contracts.
- 04 - Decide And Cover Generated Hook Surface.
