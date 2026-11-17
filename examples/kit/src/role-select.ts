import type { Role } from './schemas/team-invites';

/**
 * The field members that the role select uses: a field handle of `members.<index>.role` has them. An item path
 * reads `undefined` when the index has no item.
 */
type RoleField = { get(): Role | undefined; change(role: Role): void; blur(): void };

/**
 * E24. The role select of the design system reports `onValueChange`, not `input`. Its props come from the field
 * handle, so the change and the blur go through the events of the form.
 */
export const roleSelectProps = (field: RoleField) => ({
  value: field.get(),
  onValueChange: (role: Role) => field.change(role),
  onBlur: () => field.blur(),
});
