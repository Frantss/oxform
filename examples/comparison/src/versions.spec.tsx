import { SignIn as SignInFormisch } from './sign-in/formisch';
import { SignIn as SignInOxformLean } from './sign-in/oxform-lean';
import { SignIn as SignInOxformStandard } from './sign-in/oxform-standard';
import { SignIn as SignInReactHookForm } from './sign-in/react-hook-form';
import { SignIn as SignInTanStackForm } from './sign-in/tanstack-form';
import { TeamInvites as TeamInvitesFormisch } from './team-invites/formisch';
import { TeamInvites as TeamInvitesOxformLean } from './team-invites/oxform-lean';
import { TeamInvites as TeamInvitesOxformStandard } from './team-invites/oxform-standard';
import { TeamInvites as TeamInvitesReactHookForm } from './team-invites/react-hook-form';
import { TeamInvites as TeamInvitesTanStackForm } from './team-invites/tanstack-form';
import { signInSuite } from './sign-in/suite';
import { teamInvitesSuite } from './team-invites/suite';

// Every version of each form passes the shared suite of its specification.
signInSuite('Oxform, lean chain', SignInOxformLean);
signInSuite('Oxform, standard', SignInOxformStandard);
signInSuite('TanStack Form', SignInTanStackForm);
signInSuite('React Hook Form', SignInReactHookForm);
signInSuite('Formisch', SignInFormisch);
teamInvitesSuite('Oxform, lean chain', TeamInvitesOxformLean);
teamInvitesSuite('Oxform, standard', TeamInvitesOxformStandard);
teamInvitesSuite('TanStack Form', TeamInvitesTanStackForm);
teamInvitesSuite('React Hook Form', TeamInvitesReactHookForm);
teamInvitesSuite('Formisch', TeamInvitesFormisch);
