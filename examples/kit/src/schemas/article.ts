import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(1, 'Enter a title.'),
  body: z.string().min(1, 'Write the article.'),
});

export type Article = z.infer<typeof articleSchema>;

export const emptyArticle: Article = { title: '', body: '' };

/** Advice, not a rule: search results cut a longer title. */
export const articleAdviceSchema = z.object({
  title: z.string().max(60, 'Search results cut a title over 60 characters.'),
});
