import { z } from 'zod';
import { roles } from './team-invites';

export const memberFilterSchema = z.object({ query: z.string(), role: z.enum(['', ...roles]) });

export type MemberFilter = z.infer<typeof memberFilterSchema>;

export const emptyMemberFilter: MemberFilter = { query: '', role: '' };
