import { slots } from '@oxform/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { articleEditor } from './article-editor';
import { articleAdviceSchema } from './schemas/article';
import { readPart } from './testing';
import { warningSlots, warnings } from './warnings';

const advised = articleEditor
  .extend(warnings)
  .extend(slots(slot => warningSlots(slot)))
  .configure({ warning: { change: articleAdviceSchema, submit: articleAdviceSchema } });

const longTitle = 'Notes on the analytical engine, and on what it could compute one day';

const setup = () => {
  const onSubmit = vi.fn();
  const form = advised.create({ defaultValues: { title: 'Notes', body: 'The engine weaves patterns.' }, onSubmit });
  return { form, onSubmit, [Symbol.dispose]: () => form.destroy() };
};

describe('warnings', () => {
  it('shows advice on a long title in the fieldWarning part', async () => {
    using subject = setup();
    subject.form.events.change('title', longTitle);
    await vi.waitFor(() => expect(subject.form.warning.at('title')).toHaveLength(1));

    expect(readPart(advised, subject.form, 'fieldWarning', 'title')).toEqual({
      present: true,
      text: 'Search results cut a title over 60 characters.',
      attrs: { role: 'status' },
    });
  });

  it('does not stop the writer from publishing', async () => {
    using subject = setup();
    subject.form.values.set('title', longTitle);
    await subject.form.submit.run();

    expect([subject.form.warning.at('title').length, subject.onSubmit.mock.calls.length]).toEqual([1, 1]);
  });
});
