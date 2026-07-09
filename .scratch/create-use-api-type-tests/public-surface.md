# Public Create/Use API Surface

This inventory is derived from package export files, not from source filenames.

## Core

Schema-dependent public `create*` exports:

- `createForm`
- `createField`
- `createArrayField`
- `createEffect`

Non-`create*` public helpers such as `formOptions` are outside this matrix.

## React

Schema-dependent public `use*` exports:

- `useForm`
- `useField`
- `useFieldApi`
- `useArrayField`
- `useFormStatus`
- `useFormEffect`
- `useSubscribe`

## Excluded

- `useIsomorphicLayoutEffect` is an internal source helper and is not exported from the React package.
- `useFormContext` is currently internal to the provider module and is not exported from the React package.
- The `defineForm` source helper and its generated hooks are not exported from the React package. They are excluded from this public matrix until they become package exports.
