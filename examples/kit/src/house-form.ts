import { slots, type Form } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { formErrorSlots } from './form-error-slots';
import { normalizeEmail } from './normalize-email';
import { strictSubmitSlots } from './strict-submit-slots';

/**
 * E04. A preset that adds: every form of the team gets the same banner, submit rule and email clean-up. It is
 * `standard`, then E08, E12 and E13. The checkout and the team invites use it.
 */
export const houseForm = <Values, Api extends {}, Options, State extends {}, Slots, Fields>(
  form: Form<Values, Api, Options, State, Slots, Fields>,
) =>
  form
    .extend(standard)
    .extend(normalizeEmail)
    .extend(slots(slot => ({ ...formErrorSlots(slot), ...strictSubmitSlots(slot) })));
