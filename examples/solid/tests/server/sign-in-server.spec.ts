import { describe, expect, it } from 'vite-plus/test';
import { answerSignIn } from '../../src/examples/sign-in-server';

describe('answerSignIn', () => {
  it('renders the posted values with their errors, in a form that posts again', async () => {
    const html = await answerSignIn({ email: 'ada', password: '' });

    expect(html).toMatch(/<form[^>]* method="post"/u);
    expect(html).toMatch(/<input[^>]* name="email"[^>]* value="ada"|<input[^>]* value="ada"[^>]* name="email"/u);
    expect(html).toContain('Enter an email address.');
    expect(html).toContain('The password has at least 8 characters.');
  });

  it('renders no error when the sign-in succeeds', async () => {
    const html = await answerSignIn({ email: 'ada@example.com', password: 'analytical' });

    expect(html).not.toContain('role="alert"');
  });
});
