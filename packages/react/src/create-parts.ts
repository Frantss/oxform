import type { Form } from '@oxform/core';
import { slotsOf } from '@oxform/core/adapter';

export const createParts = (form: Form) => ({ slots: slotsOf(form) });
