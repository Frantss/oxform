import type { Path } from '@oxform/core';
import type { Article } from './schemas/article';
import type { Checkout } from './schemas/checkout';
import type { SignIn } from './schemas/sign-in';

/** The servers of the examples: in-memory stand-ins with the calls that the forms make. */
export const articles = {
  saved: new Map<string, Article>(),
  async publish(id: string, article: Article) {
    articles.saved.set(id, article);
  },
};

export type PaymentIssue = { readonly path: Path<Checkout>; readonly message: string };

export const payments = {
  /** Declines a card that starts with 4000, as the test cards of payment providers do. */
  async charge(order: Checkout): Promise<{ readonly issues: readonly PaymentIssue[] }> {
    const declined = order.card.number.replace(/\D/gu, '').startsWith('4000');
    return { issues: declined ? [{ path: 'card.number', message: 'The bank declined the card.' }] : [] };
  },
};

export const directory = {
  members: new Set(['ada@example.com']),
  async isMember(email: string) {
    return directory.members.has(email);
  },
};

export const auth = {
  accounts: new Map([['ada@example.com', 'analytical']]),
  async signIn(credentials: SignIn) {
    return auth.accounts.get(credentials.email) === credentials.password;
  },
};
