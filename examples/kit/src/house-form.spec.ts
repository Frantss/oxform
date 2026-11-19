import { slotsOf } from '@oxform/core/adapter';
import { describe, expect, it } from 'vite-plus/test';
import { houseCheckout, houseTeamInvites } from './house-forms';
import { readPart } from './testing';

const setup = () => {
  const form = houseTeamInvites.create({
    defaultValues: { team: '', seats: 1, members: [{ email: '', role: 'member' }] },
    onSubmit: () => {},
  });
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('houseForm', () => {
  it('gives the parts of standard and the formError part', () => {
    using _subject = setup();

    expect(Object.keys(slotsOf(houseTeamInvites))).toEqual(['root', 'field', 'fieldError', 'submit', 'reset', 'formError']);
  });

  it('cleans up pasted emails', () => {
    using subject = setup();
    subject.form.field('members.0.email').change(' Ada@Example.com');

    expect(subject.form.values.get('members.0.email')).toBe('ada@example.com');
  });

  it('shows the banner and disables the submit button after a failed submit', async () => {
    using subject = setup();
    await subject.form.submit.run();

    expect([
      readPart(houseTeamInvites, subject.form, 'formError').present,
      readPart(houseTeamInvites, subject.form, 'submit').attrs.disabled,
    ]).toEqual([true, true]);
  });

  it('gives a second form with its own schema the same parts', () => {
    expect(Object.keys(slotsOf(houseCheckout))).toEqual(Object.keys(slotsOf(houseTeamInvites)));
  });
});
