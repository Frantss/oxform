import type { Scope } from '@oxform/core';
import type { Member } from './schemas/team-invites';

/**
 * E16. A row must not know its index. It takes the scope of one member, from `form.scope('members.0')`, and reads
 * its fields by their names in the member.
 */
export const memberLabel = (member: Scope<Member, 'error'>) =>
  `${member.field('email').get() || 'New member'} (${member.field('role').get()})`;
