import { describe, expect, it } from 'vite-plus/test';
import { roleSelectProps } from './role-select';
import { teamInvites } from './team-invites';

const setup = () => {
  const form = teamInvites.create({ defaultValues: { team: 'Design', seats: 1, members: [{ email: '', role: 'member' }] } });
  return { form, props: () => roleSelectProps(form.field('members.0.role')), [Symbol.dispose]: () => form.destroy() };
};

describe('roleSelectProps', () => {
  it('writes the value of onValueChange as a change of the user', () => {
    using subject = setup();
    subject.props().onValueChange('admin');

    expect([subject.props().value, subject.form.status.at('members.0.role').dirty]).toEqual(['admin', true]);
  });

  it('marks the field blurred on onBlur', () => {
    using subject = setup();
    subject.props().onBlur();

    expect(subject.form.status.at('members.0.role').blurred).toBe(true);
  });
});
