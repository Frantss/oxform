import type { ComponentType } from 'react';
import { ArticleEditor } from './article-editor';
import { Checkout } from './checkout';
import { MemberFilter } from './member-filter';
import { SignIn } from './sign-in';
import { TeamInvites } from './team-invites';

const firstArticle = { title: 'Notes on the analytical engine', body: 'The engine weaves algebraic patterns.' };

/** The five domain forms of the catalogue. The app and the playground list them. */
export const examples: readonly { readonly id: string; readonly label: string; readonly Component: ComponentType }[] = [
  { id: 'sign-in', label: 'Sign-in', Component: SignIn },
  { id: 'checkout', label: 'Checkout', Component: Checkout },
  { id: 'team-invites', label: 'Team invites', Component: TeamInvites },
  { id: 'article-editor', label: 'Article editor', Component: () => <ArticleEditor article={firstArticle} /> },
  { id: 'member-filter', label: 'Member filter', Component: MemberFilter },
];

export const exampleOf = (id: string | null) => examples.find(example => example.id === id) ?? examples[0]!;
