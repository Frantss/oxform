import { createDrafts } from 'example-oxform-kit/article-drafts';
import { articleStatus } from 'example-oxform-kit/article-status';
import type { Article } from 'example-oxform-kit/schemas/article';
import { warnBeforeUnload } from 'example-oxform-kit/unsaved-warning';
import { onCleanup, Show } from 'solid-js';
import { articleEditorParts } from './article-editor-form';

const { Root, Field, FieldError, FieldWarning, AutosaveStatus, useForm, useSelector } = articleEditorParts;

/** E22, E23 and E25: the unsaved label, "Discard", "Publish", and the warning before the tab closes. */
const Actions = () => {
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

/** E05, E06, E07, E14 and E22 to E25. The article comes from the page, and the rest from `configure`. */
export const ArticleEditor = (props: { readonly article: Article }) => (
  <Root aria-label='Article editor' novalidate options={{ defaultValues: props.article }}>
    <label>
      Title
      <Field name='title' />
    </label>
    <FieldError name='title' />
    <FieldWarning name='title' />
    <label>
      Body
      <Field name='body' render={fieldProps => <textarea rows={8} {...fieldProps} />} />
    </label>
    <FieldError name='body' />
    <AutosaveStatus />
    <Actions />
  </Root>
);
