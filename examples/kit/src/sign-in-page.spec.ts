import { describe, expect, it, vi } from 'vite-plus/test';
import { signInPage } from './sign-in-page';

const setup = () => {
  vi.useFakeTimers();
  const forms = [signInPage.create({ id: 'request-1' }), signInPage.create({ id: 'request-2' })];
  return {
    forms,
    [Symbol.dispose]: () => {
      forms.forEach(form => form.destroy());
      vi.useRealTimers();
    },
  };
};

describe('signInPage', () => {
  it('makes one instance per render, with the id of the adapter', () => {
    using subject = setup();
    subject.forms[0]!.values.set('email', 'ada@example.com');

    expect(subject.forms.map(form => [form.id, form.values.get('email')])).toEqual([
      ['request-1', 'ada@example.com'],
      ['request-2', ''],
    ]);
  });

  it('starts no timer when a render makes an instance', () => {
    using _subject = setup();

    expect(vi.getTimerCount()).toBe(0);
  });
});
