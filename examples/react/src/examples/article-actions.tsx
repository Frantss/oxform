import { createParts } from '@oxform/react';
import { createDrafts } from 'example-oxform-kit/article-drafts';
import { articleStatus } from 'example-oxform-kit/article-status';
import { warnBeforeUnload } from 'example-oxform-kit/unsaved-warning';
import { useEffect, useMemo } from 'react';
import { articleEditorForm } from './article-editor-form';

const { useForm, useSelector } = createParts(articleEditorForm);

/** E22, E23 and E25: the unsaved label, "Publish", "Discard", and the warning before the tab closes. */
export const ArticleActions = () => {
  const form = useForm();
  const status = useSelector(articleStatus, {
    compare: (a, b) => a.unsaved === b.unsaved && a.publishDisabled === b.publishDisabled,
  });
  const drafts = useMemo(() => createDrafts(form), [form]);
  // A published article is the new baseline of "Discard".
  useEffect(() => form.submit.onResult(result => result.successful && drafts.saved()), [form, drafts]);
  useEffect(() => warnBeforeUnload(form), [form]);

  return (
    <>
      {status.unsaved && <p>Unsaved changes</p>}
      <button type='submit' disabled={status.publishDisabled}>
        Publish
      </button>
      <button type='button' onClick={drafts.discard}>
        Discard
      </button>
    </>
  );
};
