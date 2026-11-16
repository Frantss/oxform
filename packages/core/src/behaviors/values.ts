import { defineExtension, type Form } from '#main/form';

export const values = (form: Form) => defineExtension(form, { name: 'values' });
