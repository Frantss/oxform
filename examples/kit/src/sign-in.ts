import { defineForm } from '@oxform/core';
import { values } from '@oxform/core/behaviors';

export const signInForm = defineForm().extend(values);
