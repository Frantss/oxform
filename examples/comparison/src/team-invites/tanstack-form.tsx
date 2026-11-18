import { useForm } from '@tanstack/react-form';
import * as v from 'valibot';
import { server } from '../server';
import { emptyMember, emptyTeamInvites, memberMessage, roles, teamInvitesSchema, type Member } from './schema';

const { team, seats, members } = teamInvitesSchema.entries;
const emailSchema = members.item.entries.email;

const messageOf = (errors: readonly unknown[]) => {
  const [first] = errors;
  return typeof first === 'string' ? first : (first as { message?: string } | undefined)?.message;
};

const Message = ({ id, errors }: { readonly id: string; readonly errors: readonly unknown[] }) => {
  const message = messageOf(errors);
  return message ? <p id={id}>{message}</p> : null;
};

export const TeamInvites = () => {
  const form = useForm({
    defaultValues: emptyTeamInvites,
    // A field with an error would block the submit, and its validation, without this option.
    canSubmitWhenInvalid: true,
    onSubmit: ({ value }) => server.sendInvites(value),
  });
  const describedBy = (id: string, errors: readonly unknown[]) => (messageOf(errors) ? id : undefined);

  return (
    <form
      aria-label='Team invites'
      noValidate
      onSubmit={event => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {/* The form validators run only when every field is valid, so each field has its rules. */}
      <form.Field name='team' validators={{ onSubmit: team }}>
        {field => (
          <>
            <label>
              Team
              <input
                value={field.state.value}
                aria-describedby={describedBy('team-error', field.state.meta.errors)}
                onChange={event => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
              />
            </label>
            <Message id='team-error' errors={field.state.meta.errors} />
          </>
        )}
      </form.Field>
      <form.Field name='seats' validators={{ onSubmit: seats }}>
        {field => (
          <>
            <label>
              Seats
              <input
                type='number'
                value={field.state.value}
                aria-describedby={describedBy('seats-error', field.state.meta.errors)}
                onChange={event => field.handleChange(event.target.valueAsNumber)}
                onBlur={field.handleBlur}
              />
            </label>
            <Message id='seats-error' errors={field.state.meta.errors} />
          </>
        )}
      </form.Field>
      <form.Field name='members' mode='array'>
        {rows => (
          <>
            <ul aria-label='Members'>
              {rows.state.value.map((_, index) => (
                <li key={index}>
                  <form.Field
                    name={`members[${index}].email`}
                    validators={{
                      onChange: emailSchema,
                      // On blur no sync validator gates the lookup, so it checks the format itself. Submit runs it too.
                      onBlurAsync: async ({ value }) =>
                        v.is(emailSchema, value) && (await server.isMember(value)) ? memberMessage : undefined,
                    }}
                  >
                    {field => (
                      <>
                        <label>
                          Email
                          <input
                            type='email'
                            value={field.state.value}
                            aria-describedby={describedBy(`member-${index}-error`, field.state.meta.errors)}
                            onChange={event => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </label>
                        <Message id={`member-${index}-error`} errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                  <form.Field name={`members[${index}].role`}>
                    {field => (
                      <label>
                        Role
                        <select
                          value={field.state.value}
                          onChange={event => field.handleChange(event.target.value as Member['role'])}
                          onBlur={field.handleBlur}
                        >
                          {roles.map(role => (
                            <option key={role}>{role}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </form.Field>
                  <button type='button' disabled={index === 0} onClick={() => rows.moveValue(index, index - 1)}>
                    Move up
                  </button>
                  <button type='button' onClick={() => rows.removeValue(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type='button' onClick={() => rows.pushValue(emptyMember)}>
              Add member
            </button>
          </>
        )}
      </form.Field>
      <button type='submit'>Send invites</button>
      <button type='button' onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
};
