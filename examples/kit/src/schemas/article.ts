import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(1, 'Enter a title.'),
  body: z.string().min(1, 'Write the article.'),
});

export type Article = z.infer<typeof articleSchema>;

export const emptyArticle: Article = { title: '', body: '' };
