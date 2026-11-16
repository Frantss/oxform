import type { AnyForm } from '@oxform/core';
import { slotsOf } from '@oxform/core/adapter';

export const createParts = (form: AnyForm) => ({ slots: Object.keys(slotsOf(form)) });
