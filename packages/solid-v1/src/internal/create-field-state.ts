import { createStoreState } from '#internal/create-store-state';
import { selectProperties } from '#internal/select-properties';
import type { FieldApi, FieldStore } from 'oxform-core';
import { createMemo, untrack } from 'solid-js';

export const createFieldState = <Value, Level extends string>(
  api: Pick<FieldApi<Value, Level>, 'store'>,
): FieldStore<Value, Level> => {
  const source = createStoreState(api);
  // A removed array row can receive a final store notification before Solid disposes it.
  const state = createMemo<FieldStore<Value, Level>>(
    previous => (source().status ? source() : previous),
    untrack(source),
  );
  const result = selectProperties(state, ['id', 'value', 'defaultValue', 'issues', 'ref']);
  const status = selectProperties(
    () => state().status,
    ['blurred', 'touched', 'dirty', 'default', 'valid', 'pristine'],
  );
  return Object.assign(result, { status });
};
