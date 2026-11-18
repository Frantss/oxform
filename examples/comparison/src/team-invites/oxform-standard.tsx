import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { createParts } from '@oxform/react';
import { server } from '../server';
import { emptyMember, emptyTeamInvites, roles, teamInvitesLookupSchema, teamInvitesSchema } from './schema';

/** The `standard` preset. The format on change, the lookup on blur, both on submit (E18). */
const teamInvites = defineForm({ schema: teamInvitesSchema, defaultValues: emptyTeamInvites })
  .extend(standard)
  .configure({
    error: { change: teamInvitesSchema, blur: teamInvitesLookupSchema, submit: teamInvitesLookupSchema },
    onSubmit: invites => server.sendInvites(invites),
  });

const { Root, Field, FieldError, Submit, Reset, useArray } = createParts(teamInvites);

/** The rows of `useArray`, keyed by the item ids (E17). */
const Members = () => {
  const members = useArray('members');
  return (
    <>
      <ul aria-label='Members'>
        {members.ids.map((id, index) => (
          <li key={id}>
            <label>
              Email
              <Field name={`members.${index}.email`} type='email' />
            </label>
            <FieldError name={`members.${index}.email`} />
            <label>
              Role
              <Field
                name={`members.${index}.role`}
                render={
                  <select>
                    {roles.map(role => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                }
              />
            </label>
            <button type='button' disabled={index === 0} onClick={() => members.move(index, index - 1)}>
              Move up
            </button>
            <button type='button' onClick={() => members.remove(index)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type='button' onClick={() => members.append(emptyMember)}>
        Add member
      </button>
    </>
  );
};

export const TeamInvites = () => (
  <Root aria-label='Team invites' noValidate>
    <label>
      Team
      <Field name='team' />
    </label>
    <FieldError name='team' />
    <label>
      Seats
      <Field name='seats' type='number' />
    </label>
    <FieldError name='seats' />
    <Members />
    <Submit>Send invites</Submit>
    <Reset>Reset</Reset>
  </Root>
);
