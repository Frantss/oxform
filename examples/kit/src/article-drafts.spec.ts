import { describe, expect, it } from 'vite-plus/test';
import { articleEditor } from './article-editor';
import { createDrafts } from './article-drafts';

const loaded = { title: 'Notes', body: 'First text.' };

const setup = () => {
  const form = articleEditor.create({ defaultValues: loaded });
  return { form, drafts: createDrafts(form), [Symbol.dispose]: () => form.destroy() };
};

describe('createDrafts', () => {
  it('discards to the loaded text before a save', () => {
    using subject = setup();
    subject.form.events.change('body', 'Edited.');
    subject.drafts.discard();

    expect([subject.form.values.get(), subject.form.status.form.dirty]).toEqual([loaded, false]);
  });

  it('discards to the last saved text after a save', () => {
    using subject = setup();
    subject.form.events.change('body', 'Saved text.');
    subject.drafts.saved();
    const clean = subject.form.status.form.dirty;
    subject.form.events.change('body', 'Edited after the save.');
    subject.drafts.discard();

    expect([clean, subject.form.values.get('body')]).toEqual([false, 'Saved text.']);
  });
});
