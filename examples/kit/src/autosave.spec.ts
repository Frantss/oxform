import { slots } from '@oxform/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { articleEditor } from './article-editor';
import { autosave } from './autosave';
import { readPart } from './testing';
import { warningSlots, warnings } from './warnings';

const article = { title: 'Notes on the engine', body: 'The engine weaves patterns.' };

/** E07: the article editor with `warnings`, so a failed save can show on `title`. */
const editor = articleEditor
  .extend(warnings)
  .extend(slots(slot => warningSlots(slot)))
  .extend(autosave);

const setup = (saveDraft: (draft: typeof article) => Promise<unknown> = async () => {}) => {
  vi.useFakeTimers();
  const save = vi.fn(saveDraft);
  const form = editor.create({
    defaultValues: article,
    saveDraft: save,
    autosaveDelay: 500,
    onSaveError: (_error, instance) => instance.warning.set('title', [{ message: 'The draft was not saved.' }]),
  });
  return {
    form,
    save,
    [Symbol.dispose]: () => {
      form.destroy();
      vi.useRealTimers();
    },
  };
};

describe('autosave', () => {
  it('does nothing at creation', async () => {
    using subject = setup();
    await vi.runAllTimersAsync();

    expect([subject.save.mock.calls.length, subject.form.store.state.autosave.dirty]).toEqual([0, false]);
  });

  it('saves once the values stop changing', async () => {
    using subject = setup();
    subject.form.values.set('title', 'Notes');
    await vi.advanceTimersByTimeAsync(300);
    subject.form.values.set('title', 'Notes on the analytical engine');
    await vi.advanceTimersByTimeAsync(500);

    expect([subject.save.mock.calls, subject.form.store.state.autosave]).toEqual([
      [[{ ...article, title: 'Notes on the analytical engine' }]],
      { saving: false, dirty: false, savedAt: expect.any(Date) },
    ]);
  });

  it('does not save invalid values, and stays dirty', async () => {
    using subject = setup();
    subject.form.values.set('title', '');
    await vi.advanceTimersByTimeAsync(500);

    expect([subject.save.mock.calls.length, subject.form.store.state.autosave.dirty]).toEqual([0, true]);
  });

  it('gives a failed save to onSaveError with the form, which shows it on the title', async () => {
    using subject = setup(() => Promise.reject(new Error('offline')));
    subject.form.values.set('body', 'More text.');
    await vi.advanceTimersByTimeAsync(500);

    expect([subject.form.warning.at('title')[0]?.message, subject.form.store.state.autosave.dirty]).toEqual(['The draft was not saved.', true]);
  });

  it('saves at once on flush', async () => {
    using subject = setup();
    subject.form.values.set('body', 'More text.');
    await subject.form.autosave.flush();

    expect(subject.save.mock.calls.length).toBe(1);
  });

  it('drops a pending save when the form is destroyed', async () => {
    using subject = setup();
    subject.form.values.set('body', 'More text.');
    subject.form.destroy();
    await vi.runAllTimersAsync();

    expect(subject.save.mock.calls.length).toBe(0);
  });

  it('shows the save state in the autosaveStatus part', async () => {
    using subject = setup();
    const status = () => readPart(editor, subject.form, 'autosaveStatus').text;
    const before = status();
    subject.form.values.set('body', 'More text.');
    const changed = status();
    await vi.advanceTimersByTimeAsync(500);

    expect([before, changed, status()]).toEqual([undefined, 'Unsaved changes', 'Draft saved']);
  });
});
