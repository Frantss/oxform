import { createParts } from '@oxform/solid/v2';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { MemberRow } from '../src/examples/member-row';
import { teamInvitesForm } from '../src/examples/team-invites-form';
import { setup } from './setup';

const { Root, useForm, useSelector } = createParts(teamInvitesForm);

/** The first member through its scope, and its values as text. */
const FirstMember = () => {
  const form = useForm();
  const member = useSelector(state => state.values.members[0]);
  return (
    <>
      <MemberRow member={form.scope('members.0')} />
      <output>{JSON.stringify(member())}</output>
    </>
  );
};

describe('MemberRow', () => {
  it('writes the role through onValueChange, and refuses a member on blur', async () => {
    using screen = setup(() => (
      <Root options={{ defaultValues: { team: 'Design', seats: 1, members: [{ email: '', role: 'member' }] } }}>
        <FirstMember />
      </Root>
    ));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'admin');
    const email = screen.getByRole('textbox', { name: 'Email' });
    await userEvent.fill(email, ' Ada@Example.com ');
    await userEvent.tab();

    await expect.element(screen.getByText('{"email":"ada@example.com","role":"admin"}')).toBeVisible();
    await expect.element(email).toHaveAccessibleDescription('This address is already a member.');
  });
});
