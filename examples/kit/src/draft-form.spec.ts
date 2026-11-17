import { describe, expect, it, vi } from 'vite-plus/test';
import { draftForm } from './draft-form';

const setup = () => {
  vi.useFakeTimers();
  const saveDraft = vi.fn();
  const form = draftForm.create({ saveDraft, autosaveDelay: 100 });
  return {
    form,
    saveDraft,
    [Symbol.dispose]: () => {
      form.destroy();
      vi.useRealTimers();
    },
  };
};

describe('draftForm', () => {
  it('tests autosave with the smallest chain and fake timers', async () => {
    using subject = setup();
    subject.form.values.set('title', 'Notes');
    await vi.advanceTimersByTimeAsync(99);
    const early = subject.saveDraft.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1);

    expect([early, subject.saveDraft.mock.calls]).toEqual([0, [[{ title: 'Notes', body: '' }]]]);
  });
});
