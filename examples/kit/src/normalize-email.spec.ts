import { defineForm } from '@oxform/core';
import { values } from '@oxform/core/behaviors';
import { describe, expect, it } from 'vite-plus/test';
import { normalizeEmail } from './normalize-email';
import { emptyTeamInvites, teamInvitesSchema } from './schemas/team-invites';

const invites = defineForm({ schema: teamInvitesSchema, defaultValues: emptyTeamInvites }).extend(values).extend(normalizeEmail);

const setup = () => {
  const form = invites.create({ defaultValues: { ...emptyTeamInvites, members: [{ email: '', role: 'member' }] } });
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('normalizeEmail', () => {
  it('trims and lower-cases an email that the user pastes', () => {
    using subject = setup();
    subject.form.values.set('members.0.email', '  Ada.Lovelace@Example.COM ');

    expect(subject.form.values.get('members.0.email')).toBe('ada.lovelace@example.com');
  });

  it('keeps a value at a path that does not end in email', () => {
    using subject = setup();
    subject.form.values.set('team', ' Design Team ');

    expect(subject.form.values.get('team')).toBe(' Design Team ');
  });
});
