import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';
import type { Simplify } from 'type-fest';

export type FieldStatus = Simplify<
  PersistedFieldStatus & {
    default: boolean;
    valid: boolean;
    pristine: boolean;
  }
>;
