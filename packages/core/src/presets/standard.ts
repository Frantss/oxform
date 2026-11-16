import type { Form } from '#core';
import { values } from '#core/behaviors';

export const standard = (form: Form): Form => form.extend(values);
