import { defineForm } from '@oxform/core';
import { houseForm } from './house-form';
import { emptyOrder, orderSchema } from './schemas/checkout';
import { emptyTeamInvites, teamInvitesSchema } from './schemas/team-invites';

/** E04. Two forms of the team on the same preset. A preset holds no schema, so each form gives its own. */
export const houseCheckout = defineForm({ schema: orderSchema, defaultValues: emptyOrder })
  .extend(houseForm)
  .configure({ error: { submit: orderSchema } });

export const houseTeamInvites = defineForm({ schema: teamInvitesSchema, defaultValues: emptyTeamInvites })
  .extend(houseForm)
  .configure({ error: { submit: teamInvitesSchema } });
