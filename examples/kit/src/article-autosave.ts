import { slots } from '@oxform/core';
import { articleEditor } from './article-editor';
import { autosave } from './autosave';
import { articles } from './services';
import { warningSlots, warnings } from './warnings';

/** E07. The article editor saves drafts, and a failed save shows as a warning on the title. */
export const autosavedArticle = articleEditor
  .extend(warnings)
  .extend(slots(slot => warningSlots(slot)))
  .extend(autosave)
  .configure({
    saveDraft: draft => articles.saveDraft(draft),
    onSaveError: (_error, form) => form.warning.set('title', [{ message: 'The draft was not saved.' }]),
  });
