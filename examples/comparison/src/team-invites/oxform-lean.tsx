import { defineForm, slots } from '@oxform/core';
import {
  arrays,
  check,
  events,
  fieldErrorSlots,
  reset,
  resetSlots,
  rootSlots,
  status,
  submit,
  submitSlots,
  validation,
  values,
} from '@oxform/core/behaviors';
import { createParts } from '@oxform/react';
import { server } from '../server';
import { emptyMember, emptyTeamInvites, roles, teamInvitesLookupSchema, teamInvitesSchema } from './schema';

/**
 * The shortest chain that passes the shared test: `standard` without `handles`. The format on change, the lookup
 * on blur, both on submit (E18).
 */
const teamInvites = defineForm({ schema: teamInvitesSchema, defaultValues: emptyTeamInvites })
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(arrays)
  .extend(reset)
  .extend(submit)
  .extend(slots(slot => ({ ...rootSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot), ...resetSlots(slot) })))
  .configure({
    error: { change: teamInvitesSchema, blur: teamInvitesLookupSchema, submit: teamInvitesLookupSchema },
    onSubmit: invites => server.sendInvites(invites),
  });

const { Root, Field, FieldError, Submit, Reset, useForm, useSelector } = createParts(teamInvites);

/** With no `handles`, the rows have no item ids: each row is keyed by its index, and its parts read the store. */
const Members = () => {
  const form = useForm();
  const count = useSelector(state => state.values.members.length);
  return (
    <>
      <ul aria-label='Members'>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
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
            <button type='button' disabled={index === 0} onClick={() => form.arrays.move('members', index, index - 1)}>
              Move up
            </button>
            <button type='button' onClick={() => form.arrays.remove('members', index)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type='button' onClick={() => form.arrays.append('members', emptyMember)}>
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
