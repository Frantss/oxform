import type { Article } from './schemas/article';

/** The server of the examples: an in-memory stand-in with the calls that the forms make. */
export const articles = {
  saved: new Map<string, Article>(),
  async publish(id: string, article: Article) {
    articles.saved.set(id, article);
  },
};
