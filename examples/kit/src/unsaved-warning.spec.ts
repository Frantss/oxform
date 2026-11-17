import { describe, expect, it } from 'vite-plus/test';
import { articleEditor } from './article-editor';
import { warnBeforeUnload } from './unsaved-warning';

const setup = () => {
  const form = articleEditor.create({ defaultValues: { title: 'Notes', body: 'First text.' } });
  const tab = new EventTarget();
  const stop = warnBeforeUnload(form, tab);
  /** True when the tab would ask before it closes. */
  const asks = () => !tab.dispatchEvent(new Event('beforeunload', { cancelable: true }));
  return {
    form,
    asks,
    stop,
    [Symbol.dispose]: () => {
      stop();
      form.destroy();
    },
  };
};

describe('warnBeforeUnload', () => {
  it('asks before the tab closes only while there are unsaved changes', () => {
    using subject = setup();
    const clean = subject.asks();
    subject.form.events.change('body', 'Edited.');
    const edited = subject.asks();
    subject.form.reset.all();

    expect([clean, edited, subject.asks()]).toEqual([false, true, false]);
  });

  it('stops asking when the caller stops it', () => {
    using subject = setup();
    subject.form.events.change('body', 'Edited.');
    subject.stop();

    expect(subject.asks()).toBe(false);
  });
});
