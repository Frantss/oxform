import { signIn } from './sign-in';
import { submitSignIn } from './sign-in-submit';

/**
 * E26. The sign-in page is rendered on the server. The form lives at module scope and holds no state: each render
 * makes its own instance. It sets no id, so the instance takes the id that the adapter gives, and the ids match
 * after hydration.
 */
export const signInPage = signIn.configure({ onSubmit: submitSignIn });
