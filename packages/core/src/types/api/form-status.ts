import type { PersistedFormStatus } from '#types/internal/persisted-form-status';
import type { Simplify } from 'type-fest';

export type FormStatus = Simplify<
  PersistedFormStatus & {
    submitted: boolean;
    valid: boolean;
  }
>;
