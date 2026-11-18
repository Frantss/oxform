import * as v from 'valibot';
import { server } from '../server';

export const roles = ['member', 'admin'] as const;

/** The format rules of the team invites form. Every version imports this module. */
export const teamInvitesSchema = v.object({
  team: v.pipe(v.string(), v.nonEmpty('Enter a team name.')),
  seats: v.pipe(v.number(), v.integer('A team has at least one seat.'), v.minValue(1, 'A team has at least one seat.')),
  members: v.array(
    v.object({ email: v.pipe(v.string(), v.email('Enter an email address.')), role: v.picklist(roles) }),
  ),
});

export type TeamInvites = v.InferOutput<typeof teamInvitesSchema>;

export type Member = TeamInvites['members'][number];

export const emptyTeamInvites: TeamInvites = { team: '', seats: 1, members: [] };

export const emptyMember: Member = { email: '', role: 'member' };

/** The message on a member email that `server.isMember` finds. */
export const memberMessage = 'This address is already a member.';

const isEmail = (email: string) => v.is(v.pipe(v.string(), v.email()), email);

/** The rules of a submit: the format, then a lookup of each address with a valid format. */
export const teamInvitesLookupSchema = v.objectAsync({
  ...teamInvitesSchema.entries,
  members: v.arrayAsync(
    v.objectAsync({
      ...teamInvitesSchema.entries.members.item.entries,
      email: v.pipeAsync(
        teamInvitesSchema.entries.members.item.entries.email,
        v.checkAsync(async email => !isEmail(email) || !(await server.isMember(email)), memberMessage),
      ),
    }),
  ),
});
