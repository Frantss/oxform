import { createEffect, type InstanceOf } from '@oxform/core';
import type { articleEditor } from './article-editor';

type Target = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

const warn = (event: Event) => event.preventDefault();

/**
 * E25. The browser must warn before the tab closes with unsaved text. An effect on `status.form.dirty` adds and
 * removes a `beforeunload` listener. It runs outside the form and outside a component, so the caller stops it.
 */
export const warnBeforeUnload = (
  form: Pick<InstanceOf<typeof articleEditor>, 'store'>,
  target: Target = globalThis,
) => {
  const effect = createEffect(
    form,
    state => state.status.form.dirty,
    dirty => (dirty ? target.addEventListener('beforeunload', warn) : target.removeEventListener('beforeunload', warn)),
  );
  return () => {
    effect.unsubscribe();
    target.removeEventListener('beforeunload', warn);
  };
};
