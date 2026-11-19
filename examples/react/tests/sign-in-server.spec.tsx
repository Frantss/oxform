import { describe, expect, it } from 'vite-plus/test';
import { answerSignIn } from '../src/examples/sign-in-server';

/** The answer as a document, to query it like a page. */
const answer = async (body: Parameters<typeof answerSignIn>[0]) => new DOMParser().parseFromString(await answerSignIn(body), 'text/html');

describe('answerSignIn', () => {
  it('renders the posted values with their errors, in a form that posts again', async () => {
    const page = await answer({ email: 'ada', password: '' });

    expect(page.querySelector('form')?.getAttribute('method')).toBe('post');
    expect(page.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe('ada');
    expect([...page.querySelectorAll('[role="alert"]')].map(alert => alert.textContent)).toEqual([
      'Enter an email address.',
      'The password has at least 8 characters.',
    ]);
  });

  it('renders no error when the sign-in succeeds', async () => {
    const page = await answer({ email: 'ada@example.com', password: 'analytical' });

    expect(page.querySelectorAll('[role="alert"]')).toHaveLength(0);
  });
});
