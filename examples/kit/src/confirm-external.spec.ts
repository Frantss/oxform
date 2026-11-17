import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { describe, expect, it, vi } from 'vite-plus/test';
import { confirmExternal } from './confirm-external';
import { teamInvitesSchema, type TeamInvites } from './schemas/team-invites';

const invites = defineForm({ schema: teamInvitesSchema, defaultValues: { team: '', seats: 1, members: [] } as TeamInvites })
  .extend(standard)
  .extend(confirmExternal)
  .configure({ companyDomain: 'example.com', error: { submit: teamInvitesSchema } });

const setup = (confirmed: boolean, team = 'Design') => {
  const onConfirm = vi.fn(async () => confirmed);
  const onSubmit = vi.fn();
  const form = invites.create({
    defaultValues: {
      team,
      seats: 2,
      members: [
        { email: 'ada@example.com', role: 'admin' },
        { email: 'grace@navy.mil', role: 'member' },
      ],
    },
    onConfirm,
    onSubmit,
  });
  return { form, onConfirm, onSubmit, [Symbol.dispose]: () => form.destroy() };
};

describe('confirmExternal', () => {
  it('asks about the addresses outside the company', async () => {
    using subject = setup(true);
    await subject.form.submit.run();

    expect([subject.onConfirm.mock.calls, subject.onSubmit.mock.calls.length]).toEqual([[[['grace@navy.mil']]], 1]);
  });

  it('cancels the submit before validation when the user does not confirm', async () => {
    using subject = setup(false, '');
    await subject.form.submit.run();

    expect([subject.onSubmit.mock.calls.length, subject.form.error.at('team')]).toEqual([0, []]);
  });
});
