import type { Scope } from '@oxform/core';
import { createParts } from '@oxform/react';
import { roleSelectProps } from 'example-oxform-kit/role-select';
import { roles, type Member, type Role } from 'example-oxform-kit/schemas/team-invites';
import { teamInvitesForm } from './team-invites-form';

const { Field, FieldError, useField } = createParts(teamInvitesForm);

type RoleSelectProps = {
  readonly value: Role | undefined;
  readonly onValueChange: (role: Role) => void;
  readonly onBlur: () => void;
};

/** A role select as a design system ships it: it reports `onValueChange`, not a DOM `input` event. */
const RoleSelect = ({ value, onValueChange, onBlur }: RoleSelectProps) => (
  <select aria-label='Role' value={value} onChange={event => onValueChange(event.target.value as Role)} onBlur={onBlur}>
    {roles.map(role => (
      <option key={role}>{role}</option>
    ))}
  </select>
);

/**
 * E16 and E24. A row gets the scope of its member and never its index. The role select takes its props from the
 * field handle of `useField`.
 */
export const MemberRow = ({ member }: { readonly member: Scope<Member, 'error'> }) => (
  <>
    <label>
      Email
      <Field scope={member} name='email' type='email' />
    </label>
    <FieldError scope={member} name='email' />
    <RoleSelect {...roleSelectProps(useField('role', { scope: member }))} />
  </>
);
