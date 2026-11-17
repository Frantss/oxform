import { defineForm } from '@oxform/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { houseForm } from './house-form';
import { emptyTeamInvites, teamInvitesSchema, type TeamInvites } from './schemas/team-invites';
import { directory } from './services';

const isEmail = (text: string) => /^[^\s@]+@[^\s@]+$/u.test(text);

/** The format rules, then a lookup on the server for each address that is already a member. */
export const invitesSchema: StandardSchemaV1<TeamInvites> = {
  '~standard': {
    version: 1,
    vendor: 'example',
    async validate(value) {
      const format = await teamInvitesSchema['~standard'].validate(value);
      const members = (value as TeamInvites).members ?? [];
      const taken = await Promise.all(
        members.map(async member => isEmail(member.email) && (await directory.isMember(member.email))),
      );
      const issues = [
        ...(format.issues ?? []),
        ...taken.flatMap((isTaken, index) =>
          isTaken ? [{ message: 'This address is already a member.', path: ['members', index, 'email'] }] : [],
        ),
      ];
      return issues.length > 0 ? { issues } : { value: value as TeamInvites };
    },
  },
};

/**
 * E18. An address that is already a member must be refused before submit, without a request per key press. The
 * format is checked on `change`, the lookup runs on `blur`, and everything runs on `submit`. A change during a
 * lookup makes it stale, and a stale result is dropped.
 */
export const teamInvites = defineForm({ schema: teamInvitesSchema, defaultValues: emptyTeamInvites })
  .extend(houseForm)
  .configure({ error: { change: teamInvitesSchema, blur: invitesSchema, submit: invitesSchema } });
