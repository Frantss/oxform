import { defineForm } from '@oxform/core';
import { slotsOf } from '@oxform/core/adapter';
import { describe, expect, it } from 'vite-plus/test';
import { houseForm } from './house-form';
import { emptyTeamInvites, teamInvitesSchema } from './schemas/team-invites';
import { readPart } from './testing';

const invites = defineForm({ schema: teamInvitesSchema, defaultValues: emptyTeamInvites })
  .extend(houseForm)
  .configure({ error: { submit: teamInvitesSchema } });

const setup = () => {
  const form = invites.create({
    defaultValues: { team: '', seats: 1, members: [{ email: '', role: 'member' }] },
    onSubmit: () => {},
  });
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('houseForm', () => {
  it('gives the parts of standard and the formError part', () => {
    using _subject = setup();

    expect(Object.keys(slotsOf(invites))).toEqual(['root', 'field', 'fieldError', 'submit', 'reset', 'formError']);
  });

  it('cleans up pasted emails', () => {
    using subject = setup();
    subject.form.field('members.0.email').change(' Ada@Example.com');

    expect(subject.form.values.get('members.0.email')).toBe('ada@example.com');
  });

  it('shows the banner and disables the submit button after a failed submit', async () => {
    using subject = setup();
    await subject.form.submit.run();

    expect([readPart(invites, subject.form, 'formError').present, readPart(invites, subject.form, 'submit').attrs.disabled]).toEqual([true, true]);
  });
});
