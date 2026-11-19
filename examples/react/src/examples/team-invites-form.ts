import { confirmExternal } from 'example-oxform-kit/confirm-external';
import { teamInvites } from 'example-oxform-kit/team-invites';

/** The team invites of the kit. An invite outside the company asks first. */
export const teamInvitesForm = teamInvites.extend(confirmExternal).configure({
  companyDomain: 'example.com',
  onConfirm: emails => window.confirm(`Invite ${emails.join(', ')} from outside the company?`),
});
