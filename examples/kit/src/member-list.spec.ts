import { describe, expect, it, vi } from 'vite-plus/test';
import { inviteMember } from './member-list';
import { teamInvites } from './team-invites';

const setup = () => {
  const form = teamInvites.create({ defaultValues: { team: 'Design', seats: 3, members: [] } });
  return { form, members: () => form.array('members'), [Symbol.dispose]: () => form.destroy() };
};

describe('inviteMember', () => {
  it('appends an empty member and gives its id', () => {
    using subject = setup();
    const id = inviteMember(subject.form);

    expect([subject.members().get(), subject.members().ids]).toEqual([[{ email: '', role: 'member' }], [id]]);
  });

  it('keeps the ids and the errors with the rows through a move and a remove', async () => {
    using subject = setup();
    const first = inviteMember(subject.form, { email: 'bad' });
    const second = inviteMember(subject.form, { email: 'grace@example.com' });
    const third = inviteMember(subject.form, { email: 'linus@example.com' });
    subject.form.field('members.0.email').change('bad');
    await vi.waitFor(() => expect(subject.form.field('members.0.email').error()).toHaveLength(1));
    subject.members().move(0, 2);
    subject.members().remove(0);

    expect([subject.members().ids, subject.form.field('members.1.email').error()[0]?.message]).toEqual([[third, first], 'Enter an email address.']);
    expect(second).not.toBe(first);
  });
});
