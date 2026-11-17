import * as v from 'valibot';

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
