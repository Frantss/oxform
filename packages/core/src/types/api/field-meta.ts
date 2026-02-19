import type { PersistedFieldMeta } from '#types/internal/persisted-field-meta';
import type { Simplify } from 'type-fest';

export type FieldMeta = Simplify<
  PersistedFieldMeta & {
    default: boolean;
    valid: boolean;
    pristine: boolean;
  }
>;
