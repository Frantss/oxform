import { inviteMember } from 'example-oxform-kit/member-list';
import { MemberRow } from './member-row';
import { teamInvitesParts } from './team-invites-form';

const { useArray, useForm } = teamInvitesParts;

/** E17 and E33. The rows come from `useArray`, keyed by the item ids, so focus and errors stay with the row. */
export const MemberList = () => {
  const form = useForm();
  const members = useArray('members');

  return (
    <fieldset>
      <legend>Members</legend>
      <ol>
        {members.ids.map((id, index) => (
          <li key={id}>
            <MemberRow member={form.scope(`members.${index}`)} />
            <button type='button' disabled={index === 0} onClick={() => members.move(index, index - 1)}>
              Move up
            </button>
            <button type='button' onClick={() => members.remove(index)}>
              Remove
            </button>
          </li>
        ))}
      </ol>
      <button type='button' onClick={() => inviteMember(form)}>
        Invite another
      </button>
    </fieldset>
  );
};
