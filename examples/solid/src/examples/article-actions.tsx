import { createParts } from '@oxform/solid';
import { createDrafts } from 'example-oxform-kit/article-drafts';
import { articleStatus } from 'example-oxform-kit/article-status';
import { warnBeforeUnload } from 'example-oxform-kit/unsaved-warning';
import { onCleanup, Show } from 'solid-js';
import { articleEditorForm } from './article-editor-form';

const { useForm, useSelector } = createParts(articleEditorForm);

/** E22, E23 and E25: the unsaved label, "Publish", "Discard", and the warning before the tab closes. */
export const ArticleActions = () => {
  const form = useForm();
  const unsaved = useSelector(state => articleStatus(state).unsaved);
  const publishDisabled = useSelector(state => articleStatus(state).publishDisabled);
  const drafts = createDrafts(form);
  // A published article is the new baseline of "Discard".
  onCleanup(form.submit.onResult(result => result.successful && drafts.saved()));
  onCleanup(warnBeforeUnload(form));

  return (
    <>
      <Show when={unsaved()}>
        <p>Unsaved changes</p>
      </Show>
      <button type='submit' disabled={publishDisabled()}>
        Publish
      </button>
      <button type='button' onClick={() => drafts.discard()}>
        Discard
      </button>
    </>
  );
};
