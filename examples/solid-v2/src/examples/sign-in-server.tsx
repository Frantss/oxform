import { createParts } from '@oxform/solid/v2';
import type { SignIn } from 'example-oxform-kit/schemas/sign-in';
import { handleSignIn } from 'example-oxform-kit/sign-in-handler';
import { signInPage } from 'example-oxform-kit/sign-in-page';
import { renderToString } from '@solidjs/web';
import { SignInFields } from './sign-in';

const { Root } = createParts(signInPage);

/**
 * E27. The answer to a posted sign-in form. The handler makes and submits the instance, and `Root` renders that
 * instance, so the HTML has the posted values and their errors. It needs the server build of Solid.
 */
export const answerSignIn = (body: SignIn) =>
  handleSignIn(body, form =>
    renderToString(() => (
      <Root form={form} aria-label='Sign in' method='post' novalidate>
        <SignInFields />
      </Root>
    )),
  );
