import { slots } from '@oxform/core';
import { createParts } from '@oxform/solid/v2';
import { articleEditor } from 'example-oxform-kit/article-editor';
import { autosave } from 'example-oxform-kit/autosave';
import { articleAdviceSchema } from 'example-oxform-kit/schemas/article';
import { articles } from 'example-oxform-kit/services';
import { warningSlots, warnings } from 'example-oxform-kit/warnings';

/** The article editor of the kit, with advice on the title, and a draft saved as the writer types. */
export const articleEditorForm = articleEditor
  .extend(warnings)
  .extend(slots(slot => warningSlots(slot)))
  .extend(autosave)
  .configure({
    warning: { change: articleAdviceSchema, submit: articleAdviceSchema },
    saveDraft: draft => articles.saveDraft(draft),
    onSaveError: (_error, form) => form.warning.set('', [{ message: 'The draft was not saved. Keep this tab open.' }]),
  });

export const articleEditorParts = createParts(articleEditorForm);
