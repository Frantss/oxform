import { slots } from '@oxform/core';
import { articleEditor } from './article-editor';
import { articleAdviceSchema } from './schemas/article';
import { warningSlots, warnings } from './warnings';

/**
 * E14. The article editor with advice on the title: the `warning` check, its validator and its part. The advice runs
 * on `change` only: the check keeps one entry per event, so a second event with the same schema gives a second entry.
 */
export const advisedArticle = articleEditor
  .extend(warnings)
  .extend(slots(slot => warningSlots(slot)))
  .configure({ warning: { change: articleAdviceSchema } });
