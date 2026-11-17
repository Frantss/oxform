import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { articleSchema, emptyArticle, type Article } from './schemas/article';
import { articles } from './services';

/**
 * E05. The validators and the publish call are the same for every article, so `configure` sets them once at
 * module scope. The article differs per page, so each page passes it to `create` (or to the `Root` options).
 * An option of `create` wins over the same option of `configure`.
 */
export const articleEditor = defineForm({ schema: articleSchema, defaultValues: emptyArticle })
  .extend(standard)
  .configure({
    error: { change: articleSchema },
    onSubmit: (article: Article, form) => articles.publish(form.id, article),
  });
