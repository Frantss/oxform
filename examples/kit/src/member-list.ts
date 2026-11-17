import type { InstanceOf } from '@oxform/core';
import { emptyMember, type Member } from './schemas/team-invites';
import type { teamInvites } from './team-invites';

/**
 * E17. The user adds, removes and reorders invitees. `arrays` moves the item ids with the items, so a row keyed by
 * its id keeps its focus and its errors. "Invite another" appends an empty member and returns its id.
 */
export const inviteMember = (form: InstanceOf<typeof teamInvites>, member: Partial<Member> = {}) => {
  const members = form.array('members');
  members.append({ ...emptyMember, ...member });
  return members.ids.at(-1)!;
};
