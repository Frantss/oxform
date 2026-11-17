import { describe, expect, it } from 'vite-plus/test';
import { articleEditor } from './article-editor';
import { articleStatus } from './article-status';

const setup = () => {
  const form = articleEditor.create({ defaultValues: { title: 'Notes', body: 'The engine weaves patterns.' } });
  return { form, status: () => articleStatus(form.store.state), [Symbol.dispose]: () => form.destroy() };
};

describe('articleStatus', () => {
  it('shows unsaved changes after an edit', () => {
    using subject = setup();
    const before = subject.status().unsaved;
    subject.form.events.change('body', 'More text.');

    expect([before, subject.status().unsaved]).toEqual([false, true]);
  });

  it('disables publish while the form validates', async () => {
    using subject = setup();
    const run = subject.form.validation.run();
    const during = subject.status().publishDisabled;
    await run;

    expect([during, subject.status().publishDisabled]).toEqual([true, false]);
  });
});
