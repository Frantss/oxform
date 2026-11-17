import { describe, expect, it, vi } from 'vite-plus/test';
import { articleEditor } from './article-editor';
import { articles } from './services';

const article = { title: 'Notes on the engine', body: 'The engine weaves patterns.' };

const setup = (options: Parameters<typeof articleEditor.create>[0] = {}) => {
  const form = articleEditor.create({ defaultValues: article, ...options });
  return { form, [Symbol.dispose]: () => (form.destroy(), articles.saved.clear()) };
};

describe('articleEditor', () => {
  it('edits the article of the page, and publishes it with the publish call of configure', async () => {
    using subject = setup({ id: 'notes' });
    subject.form.values.set('title', 'Notes on the analytical engine');
    await subject.form.submit.run();

    expect(articles.saved.get('notes')).toEqual({ ...article, title: 'Notes on the analytical engine' });
  });

  it('takes an option of create over the same option of configure', async () => {
    const onSubmit = vi.fn();
    using subject = setup({ onSubmit });
    await subject.form.submit.run();

    expect([onSubmit.mock.calls.length, articles.saved.size]).toEqual([1, 0]);
  });

  it('validates on change with the validators of configure', async () => {
    using subject = setup();
    subject.form.events.change('title', '');
    await vi.waitFor(() => expect(subject.form.error.at('title')[0]?.message).toBe('Enter a title.'));
  });
});
