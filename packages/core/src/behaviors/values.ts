import { defineExtension } from '#main/form';
import type { Extendable } from '#main/types';

export const values = <Values>(form: Extendable<Values>) => defineExtension(form, { name: 'values', api: () => ({}) });
