import {
  Field,
  FieldArray,
  getInput,
  insert,
  move,
  remove,
  reset,
  setErrors,
  useForm,
  validate,
} from '@formisch/react';
import type { FormEvent } from 'react';
import * as v from 'valibot';
import { server } from '../server';
import { emptyMember, emptyTeamInvites, memberMessage, roles, teamInvitesSchema } from './schema';

const emailSchema = teamInvitesSchema.entries.members.item.entries.email;

export const TeamInvites = () => {
  const form = useForm({ schema: teamInvitesSchema, initialInput: emptyTeamInvites, validate: 'input' });

  /**
   * The whole schema runs at each validation, so the lookup is not in it: a lookup in the schema would run on each
   * input. It runs on blur, and after the schema on submit.
   */
  const lookUp = async (index: number) => {
    const email = getInput(form, { path: ['members', index, 'email'] });
    const taken = v.is(emailSchema, email) && (await server.isMember(email));
    if (taken) setErrors(form, { path: ['members', index, 'email'], errors: [memberMessage] });
    return taken;
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const result = await validate(form);
    const members = getInput(form, { path: ['members'] }) ?? [];
    const taken = await Promise.all(members.map((_, index) => lookUp(index)));
    if (result.success && !taken.includes(true)) await server.sendInvites(result.output);
  };

  return (
    <form aria-label='Team invites' noValidate onSubmit={send}>
      <Field of={form} path={['team']}>
        {field => (
          <>
            <label>
              Team
              <input
                {...field.props}
                value={field.input ?? ''}
                aria-describedby={field.errors ? 'team-error' : undefined}
              />
            </label>
            {field.errors && <p id='team-error'>{field.errors[0]}</p>}
          </>
        )}
      </Field>
      <Field of={form} path={['seats']}>
        {field => (
          <>
            <label>
              Seats
              <input
                {...field.props}
                type='number'
                value={field.input ?? ''}
                aria-describedby={field.errors ? 'seats-error' : undefined}
              />
            </label>
            {field.errors && <p id='seats-error'>{field.errors[0]}</p>}
          </>
        )}
      </Field>
      <FieldArray of={form} path={['members']}>
        {members => (
          <>
            <ul aria-label='Members'>
              {members.items.map((item, index) => (
                <li key={item}>
                  <Field of={form} path={['members', index, 'email']}>
                    {field => (
                      <>
                        <label>
                          Email
                          <input
                            {...field.props}
                            type='email'
                            value={field.input ?? ''}
                            aria-describedby={field.errors ? `member-${index}-error` : undefined}
                            onBlur={() => {
                              field.props.onBlur();
                              void lookUp(index);
                            }}
                          />
                        </label>
                        {field.errors && <p id={`member-${index}-error`}>{field.errors[0]}</p>}
                      </>
                    )}
                  </Field>
                  <Field of={form} path={['members', index, 'role']}>
                    {field => (
                      <label>
                        Role
                        <select {...field.props} value={field.input}>
                          {roles.map(role => (
                            <option key={role}>{role}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </Field>
                  <button
                    type='button'
                    disabled={index === 0}
                    onClick={() => move(form, { path: ['members'], from: index, to: index - 1 })}
                  >
                    Move up
                  </button>
                  <button type='button' onClick={() => remove(form, { path: ['members'], at: index })}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type='button' onClick={() => insert(form, { path: ['members'], initialInput: emptyMember })}>
              Add member
            </button>
          </>
        )}
      </FieldArray>
      <button type='submit'>Send invites</button>
      <button type='button' onClick={() => reset(form)}>
        Reset
      </button>
    </form>
  );
};
