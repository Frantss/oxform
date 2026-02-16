# Form Core Classes: Expected Behaviors

## FormCoreField

### `change(name, updater, options?)`

- Updates field values for flat and nested paths.
- Supports direct values and updater functions.
- Marks target and ascendant fields as:
  - `meta.dirty = true` by default
  - `meta.touched = true` by default
- Honors options:
  - `should.dirty = false` keeps `dirty` unchanged
  - `should.touch = false` keeps `touched` unchanged
- Does not propagate `dirty`/`touched` down to descendants when changing a parent path.

### `focus(name)`

- Calls `.focus()` on registered element refs.
- Sets `meta.touched = true` for target and ascendants.
- Does not update descendant `touched`.

### `blur(name)`

- Calls `.blur()` on registered element refs.
- Sets `meta.blurred = true` for target and ascendants.
- Does not update descendant `blurred`.

### `get(name)`

- Returns current value for flat and nested fields.
- Reflects updates after `change`.

### `meta(name)`

- Returns field meta state.
- Default meta includes `dirty/touched/blurred = false`.
- Reflects updates from `focus`, `blur`, `change`.

### `register(name)`

- Stores provided DOM element as field ref.
- No-op for `null` input.

### `unregister(name)`

- Clears stored ref for target field.
- Does not affect sibling refs.

### `errors(name, options?)`

- Returns errors for target field.
- `nested: true` aggregates errors for descendant paths.
- Without `nested`, returns only target field errors.

### `setErrors(name, errors, options?)`

- Supports modes:
  - `replace` (default): replace existing errors
  - `append`: append to existing errors
  - `keep`: keep existing if non-empty, otherwise set new errors
- Updates form validity (`status.valid`) when errors are set/cleared.

### `reset(name, options?)`

- Resets target value to default by default.
- Supports custom reset value via `options.value`.
- Resets target field state:
  - `dirty = false`
  - `touched = false`
  - `blurred = false`
  - `errors = []`
- Does not affect sibling values.

## FormCoreFields

### `get(path)`

- Supports both `~root.*` paths and non-prefixed paths.
- Returns `undefined` for missing paths.

### `set(path, options)`

- Updates target entry.
- Propagates only `meta` to ascendant entries.
- `errors` and `ref` are applied only to the target entry.
- Does not update descendants or siblings.

### `reset(path)`

- Resets target entry meta/errors/ref to defaults.
- Resets descendant entries when resetting a parent path.
- Does not affect sibling or ascendant entries.

### `shift(path, position, direction)`

- Shifts array field entries left/right from a given position.
- Preserves entry identity (`id`) for moved entries.
- Handles single and multi-index shifts.

### `adjust()`

- Rebuilds missing entries from current values.
- Preserves existing entries when path already exists.
- Keeps stale entries not present in values (non-destructive merge behavior).

## FormCoreArray

### `append(name, value, options?)`

- Appends value to array end.
- Works when array is `undefined`.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Creates field entry for appended index.
- Keeps sibling values unchanged.

### `insert(name, index, value, options?)`

- Inserts at index.
- Negative index is normalized to `0`.
- Out-of-range index pads with `undefined` values.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Creates entry for inserted index and shifts existing entries right.

### `swap(name, from, to, options?)`

- Swaps two array positions.
- Negative indices are normalized to `0`.
- Same-index swap is no-op.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Swaps field entries accordingly (entry `id`s move with their items).
- Keeps sibling values unchanged.

### `move(name, from, to, options?)`

- Moves an item from one index to another.
- Negative indices are normalized to `0`.
- Same-index move is no-op.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Moves field entries accordingly (`id` follows moved item).

### `replace(name, valueOrUpdater, options?)`

- Replaces full array value.
- Supports updater function.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Rebuilds field entries to match replaced array shape.
- Removes stale trailing entries when new array is shorter.
- Keeps sibling values unchanged.

### `remove(name, index, options?)`

- Removes item at index.
- Negative index is normalized to `0`.
- Out-of-range index is normalized to last valid index.
- Marks array field `dirty/touched` by default.
- Honors `should.dirty` and `should.touch` options.
- Shifts following field entries left (`id` movement preserved).
- Removes trailing field entry.
- Keeps sibling values unchanged.
