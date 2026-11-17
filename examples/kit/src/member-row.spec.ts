import { describe, expect, it } from 'vite-plus/test';
import { memberLabel } from './member-row';
import { teamInvites } from './team-invites';

const setup = () => {
  const form = teamInvites.create({
    defaultValues: {
      team: 'Design',
      seats: 2,
      members: [
        { email: 'grace@example.com', role: 'admin' },
        { email: '', role: 'member' },
      ],
    },
  });
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('memberLabel', () => {
  it('reads a member through its scope, without its index', () => {
    using subject = setup();

    expect([memberLabel(subject.form.scope('members.0')), memberLabel(subject.form.scope('members.1'))]).toEqual([
      'grace@example.com (admin)',
      'New member (member)',
    ]);
  });
});
