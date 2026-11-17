import { defineForm } from '@oxform/core';
import { validation, values } from '@oxform/core/behaviors';
import { autosave } from './autosave';
import { articleSchema, emptyArticle } from './schemas/article';

/**
 * E28. An extension author tests `autosave` without a preset or a DOM: the smallest chain that meets its needs.
 * With no check, every validation run is valid.
 */
export const draftForm = defineForm({ schema: articleSchema, defaultValues: emptyArticle })
  .extend(values)
  .extend(validation)
  .extend(autosave);
