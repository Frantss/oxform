import { defineExtension, type Form } from '#core';

/** An extension with the given name and no behavior. */
export const named = (name: string) => (form: Form) => defineExtension(form, { name });
