import { inviteMember } from 'example-oxform-kit/member-list';
import { For } from 'solid-js';
import { MemberRow } from './member-row';
import { teamInvitesParts } from './team-invites-form';

const { useArray, useForm, useScope } = teamInvitesParts;

/**
 * E17 and E33. The rows come from `useArray`, keyed by the item ids, so focus and errors stay with the row. A row
 * is not rendered again when it moves, so its scope follows its index through an accessor.
 */
export const MemberList = () => {
  const form = useForm();
  const members = useArray('members');

  return (
    <fieldset>
      <legend>Members</legend>
      <ol>
        <For each={members.ids}>
          {(_id, index) => {
            const member = useScope(() => `members.${index()}` as const);
            return (
              <li>
                <MemberRow member={member} />
                <button type='button' disabled={index() === 0} onClick={() => members.move(index(), index() - 1)}>
                  Move up
                </button>
                <button type='button' onClick={() => members.remove(index())}>
                  Remove
                </button>
              </li>
            );
          }}
        </For>
      </ol>
      <button type='button' onClick={() => inviteMember(form)}>
        Invite another
      </button>
    </fieldset>
  );
};
