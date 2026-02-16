import type { DeepKeys, DeepKeysOfType, DeepValue } from '#more-types';
import type { ArrayLike } from '#types';

export type FormCoreFields<Values> = DeepKeys<Values>;
export type FormCoreArrayFields<Values> = DeepKeysOfType<Values, ArrayLike>;
export type FormCoreFieldValue<Values, Name extends FormCoreFields<Values>> = DeepValue<Values, Name>;
