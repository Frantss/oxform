import type { InstanceOf } from '@oxform/core';
import type { SignIn } from './schemas/sign-in';
import { signInPage } from './sign-in-page';

/**
 * E27. The sign-in form must work before JavaScript loads, so the browser posts it. The handler makes an instance
 * from the body, submits it, and renders that same instance, with its errors, through `render` (with
 * `<Root form={form}>`). It made the instance, so it destroys it.
 */
export const handleSignIn = async <Page>(
  body: SignIn,
  render: (form: InstanceOf<typeof signInPage>) => Page,
): Promise<Page> => {
  const form = signInPage.create({ defaultValues: body });
  try {
    await form.submit.run();
    return render(form);
  } finally {
    form.destroy();
  }
};
