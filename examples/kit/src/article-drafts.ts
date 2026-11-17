import type { InstanceOf } from '@oxform/core';
import type { Article } from './schemas/article';
import type { articleEditor } from './article-editor';

/**
 * E23. "Discard" must return to the last saved text, not to the text that the page first loaded. `reset.all`
 * takes the values to start from, and the default values of the form stay, so this keeps the last saved values.
 */
export const createDrafts = (form: InstanceOf<typeof articleEditor>) => {
  let saved: Article = form.values.get();
  return {
    /** After a save: the saved values are the new baseline, and the form is clean. */
    saved(values: Article = form.values.get()) {
      saved = values;
      form.reset.all({ values });
    },
    discard: () => form.reset.all({ values: saved }),
  };
};
