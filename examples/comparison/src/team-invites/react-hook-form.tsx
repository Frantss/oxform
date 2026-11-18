import { valibotResolver } from '@hookform/resolvers/valibot';
import { useFieldArray, useForm } from 'react-hook-form';
import * as v from 'valibot';
import { server } from '../server';
import {
  emptyMember,
  emptyTeamInvites,
  memberMessage,
  roles,
  teamInvitesSchema,
  type TeamInvites as Invites,
} from './schema';

const emailSchema = teamInvitesSchema.entries.members.item.entries.email;

export const TeamInvites = () => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors },
  } = useForm<Invites>({
    resolver: valibotResolver(teamInvitesSchema),
    defaultValues: emptyTeamInvites,
    mode: 'onChange',
  });
  const members = useFieldArray({ control, name: 'members' });

  /**
   * `mode` is form-wide and the resolver has no event, so the lookup is not in the resolver: it would run on each
   * change. It runs on blur, through `register`, and after the resolver on submit, valid or not.
   */
  const lookUp = async (index: number) => {
    const email = getValues(`members.${index}.email`);
    const taken = v.is(emailSchema, email) && (await server.isMember(email));
    if (taken) setError(`members.${index}.email`, { message: memberMessage });
    return taken;
  };
  const lookUpAll = () => Promise.all(getValues('members').map((_, index) => lookUp(index)));

  return (
    <form
      aria-label='Team invites'
      noValidate
      onSubmit={handleSubmit(async invites => {
        if (!(await lookUpAll()).includes(true)) await server.sendInvites(invites);
      }, lookUpAll)}
    >
      <label>
        Team
        <input aria-describedby={errors.team ? 'team-error' : undefined} {...register('team')} />
      </label>
      {errors.team && <p id='team-error'>{errors.team.message}</p>}
      <label>
        Seats
        <input
          type='number'
          aria-describedby={errors.seats ? 'seats-error' : undefined}
          {...register('seats', { valueAsNumber: true })}
        />
      </label>
      {errors.seats && <p id='seats-error'>{errors.seats.message}</p>}
      <ul aria-label='Members'>
        {members.fields.map((member, index) => {
          const error = errors.members?.[index]?.email;
          return (
            <li key={member.id}>
              <label>
                Email
                <input
                  type='email'
                  aria-describedby={error ? `member-${index}-error` : undefined}
                  {...register(`members.${index}.email`, { onBlur: () => lookUp(index) })}
                />
              </label>
              {error && <p id={`member-${index}-error`}>{error.message}</p>}
              <label>
                Role
                <select {...register(`members.${index}.role`)}>
                  {roles.map(role => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <button type='button' disabled={index === 0} onClick={() => members.move(index, index - 1)}>
                Move up
              </button>
              <button type='button' onClick={() => members.remove(index)}>
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <button type='button' onClick={() => members.append(emptyMember)}>
        Add member
      </button>
      <button type='submit'>Send invites</button>
      <button type='button' onClick={() => reset()}>
        Reset
      </button>
    </form>
  );
};
