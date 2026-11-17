import { MemberList } from './member-list';
import { teamInvitesParts } from './team-invites-form';

const { Root, Field, FieldError, FormError, Submit, Reset, useSelector } = teamInvitesParts;

const Sent = () => {
  const sent = useSelector(state => state.status.form.submits > 0 && state.status.form.successful);
  return sent ? <p role='status'>The invites are sent.</p> : null;
};

/** E04, E08, E10, E12, E13, E16 to E18 and E24, with E33. */
export const TeamInvites = () => (
  <Root aria-label='Team invites' noValidate>
    <FormError />
    <label>
      Team
      <Field name='team' />
    </label>
    <FieldError name='team' />
    <label>
      Seats
      <Field name='seats' type='number' min={1} />
    </label>
    <FieldError name='seats' />
    <MemberList />
    <Submit>Send invites</Submit>
    <Reset>Clear</Reset>
    <Sent />
  </Root>
);
