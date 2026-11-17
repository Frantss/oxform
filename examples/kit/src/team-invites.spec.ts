import { describe, expect, it, vi } from 'vite-plus/test';
import { directory } from './services';
import { teamInvites } from './team-invites';

const setup = () => {
  const onSubmit = vi.fn();
  const form = teamInvites.create({
    defaultValues: { team: 'Design', seats: 3, members: [{ email: '', role: 'member' }] },
    onSubmit,
  });
  return {
    form,
    onSubmit,
    [Symbol.dispose]: () => {
      form.destroy();
      vi.restoreAllMocks();
    },
  };
};

describe('teamInvites', () => {
  it('checks the format on change, with no lookup', async () => {
    using subject = setup();
    const lookup = vi.spyOn(directory, 'isMember');
    subject.form.field('members.0.email').change('ada');
    await vi.waitFor(() => expect(subject.form.field('members.0.email').error()).toHaveLength(1));

    expect(lookup).not.toHaveBeenCalled();
  });

  it('refuses an address that is already a member on blur', async () => {
    using subject = setup();
    subject.form.field('members.0.email').change('ada@example.com');
    subject.form.field('members.0.email').blur();

    await vi.waitFor(() => expect(subject.form.field('members.0.email').error()[0]?.message).toBe('This address is already a member.'));
  });

  it('drops the result of a lookup that a newer change made stale', async () => {
    using subject = setup();
    let answer: (isMember: boolean) => void = () => {};
    const lookup = vi.spyOn(directory, 'isMember').mockImplementationOnce(() => new Promise(resolve => (answer = resolve)));
    subject.form.field('members.0.email').change('ada@example.com');
    subject.form.field('members.0.email').blur();
    await vi.waitFor(() => expect(lookup).toHaveBeenCalled());
    subject.form.field('members.0.email').change('grace@example.com');
    answer(true);
    await vi.waitFor(() => expect(subject.form.status.form.validating).toBe(false));

    expect(subject.form.field('members.0.email').error()).toEqual([]);
  });

  it('runs the format and the lookup on submit', async () => {
    using subject = setup();
    subject.form.values.set('members.0.email', 'ada@example.com');
    subject.form.values.set('team', '');
    await subject.form.submit.run();

    expect([
      subject.onSubmit.mock.calls.length,
      subject.form.field('team').error()[0]?.message,
      subject.form.field('members.0.email').error()[0]?.message,
    ]).toEqual([0, 'Enter a team name.', 'This address is already a member.']);
  });
});
