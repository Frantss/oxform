import { signInSuite } from './sign-in/suite';
import { SignInStub } from './sign-in/stub';
import { teamInvitesSuite } from './team-invites/suite';
import { TeamInvitesStub } from './team-invites/stub';

// Each case fails against the markup with no behavior, so each one tests a behavior of the specification.
signInSuite('stub', SignInStub, true);
teamInvitesSuite('stub', TeamInvitesStub, true);
