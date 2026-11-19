import { slots } from '@oxform/core';
import { articleEditor } from './article-editor';
import { articleAdviceSchema } from './schemas/article';
import { warningSlots, warnings } from './warnings';

/** E14. The article editor with advice on the title: the `warning` check, its validators and its part. */
export const advisedArticle = articleEditor
  .extend(warnings)
  .extend(slots(slot => warningSlots(slot)))
  .configure({ warning: { change: articleAdviceSchema, submit: articleAdviceSchema } });
