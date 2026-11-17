import type { Scope } from '@oxform/core';
import { roleSelectProps } from 'example-oxform-kit/role-select';
import { roles, type Member, type Role } from 'example-oxform-kit/schemas/team-invites';
import { For } from 'solid-js';
import { teamInvitesParts } from './team-invites-form';

const { Field, FieldError, useField } = teamInvitesParts;

type RoleSelectProps = {
  readonly value: Role | undefined;
  readonly onValueChange: (role: Role) => void;
  readonly onBlur: () => void;
};

/** A role select as a design system ships it: it reports `onValueChange`, not a DOM `input` event. */
const RoleSelect = (props: RoleSelectProps) => (
  <select
    aria-label='Role'
    value={props.value}
    onChange={event => props.onValueChange(event.currentTarget.value as Role)}
    onBlur={() => props.onBlur()}
  >
    <For each={roles}>{role => <option>{role}</option>}</For>
  </select>
);

/**
 * E16 and E24. A row gets the scope of its member and never its index. The role select takes its props from the
 * field handle of `useField`, whose `get()` tracks.
 */
export const MemberRow = (props: { readonly member: Scope<Member, 'error'> }) => {
  const field = useField('role', { scope: props.member });
  // `roleSelectProps` reads the value when it runs, so the value is read again in a reactive prop.
  const select = () => roleSelectProps(field);

  return (
    <>
      <label>
        Email
        <Field scope={props.member} name='email' type='email' />
      </label>
      <FieldError scope={props.member} name='email' />
      <RoleSelect
        value={select().value}
        onValueChange={role => select().onValueChange(role)}
        onBlur={() => select().onBlur()}
      />
    </>
  );
};
