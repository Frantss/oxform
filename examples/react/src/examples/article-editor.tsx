import { createDrafts } from 'example-oxform-kit/article-drafts';
import { articleStatus } from 'example-oxform-kit/article-status';
import type { Article } from 'example-oxform-kit/schemas/article';
import { warnBeforeUnload } from 'example-oxform-kit/unsaved-warning';
import { useEffect, useMemo } from 'react';
import { articleEditorParts } from './article-editor-form';

const { Root, Field, FieldError, FieldWarning, AutosaveStatus, useForm, useSelector } = articleEditorParts;

/** E22, E23 and E25: the unsaved label, "Discard", "Publish", and the warning before the tab closes. */
const Actions = () => {
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

/** E05, E06, E07, E14 and E22 to E25. The article comes from the page, and the rest from `configure`. */
export const ArticleEditor = ({ article }: { readonly article: Article }) => (
  <Root aria-label='Article editor' noValidate options={{ defaultValues: article }}>
    <label>
      Title
      <Field name='title' />
    </label>
    <FieldError name='title' />
    <FieldWarning name='title' />
    <label>
      Body
      <Field name='body' render={<textarea rows={8} />} />
    </label>
    <FieldError name='body' />
    <AutosaveStatus />
    <Actions />
  </Root>
);
