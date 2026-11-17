import { z } from 'zod';

export const roles = ['member', 'admin'] as const;

export const memberSchema = z.object({ email: z.email('Enter an email address.'), role: z.enum(roles) });

export type Member = z.infer<typeof memberSchema>;

export const teamInvitesSchema = z.object({
  team: z.string().min(1, 'Enter a team name.'),
  seats: z.number().int().min(1, 'A team has at least one seat.'),
  members: z.array(memberSchema),
});

export type TeamInvites = z.infer<typeof teamInvitesSchema>;

export const emptyMember: Member = { email: '', role: 'member' };

export const emptyTeamInvites: TeamInvites = { team: '', seats: 1, members: [] };
