import { createParts } from '@oxform/react';
import type { Article } from 'example-oxform-kit/schemas/article';
import { ArticleActions } from './article-actions';
import { articleEditorForm } from './article-editor-form';

const { Root, Field, FieldError, FieldWarning, AutosaveStatus } = createParts(articleEditorForm);

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
    <ArticleActions />
  </Root>
);
