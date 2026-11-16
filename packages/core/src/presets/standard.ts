import type { Form } from '#core';
import { values } from '#core/behaviors';

export const standard = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) => form.extend(values);
