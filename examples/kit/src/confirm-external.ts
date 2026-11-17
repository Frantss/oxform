import { defineExtension, optionTypes, type Extendable, type MaybePromise, type Needs } from '@oxform/core';

type Invites = { readonly members: readonly { readonly email: string }[] };

/**
 * E10. An invite to an address outside the company cannot be undone. Before validation, `confirmExternal` asks the
 * `onConfirm` option about the addresses outside `companyDomain`, and cancels the submit until it resolves true.
 */
export const confirmExternal = <Values extends Invites>(form: Extendable<Values, Needs<Values, 'submit'>>) =>
  defineExtension(form, {
    name: 'confirmExternal',
    needs: { api: ['submit'] },
    options: optionTypes<{ companyDomain: string; onConfirm: (emails: readonly string[]) => MaybePromise<boolean> }>(),
    api: (context, { submit }) => {
      submit.intercept(async attempt => {
        const { companyDomain, onConfirm } = context.options();
        if (companyDomain === undefined) return;
        const external = attempt.values.members
          .map(member => member.email)
          .filter(email => !email.endsWith(`@${companyDomain}`));
        if (external.length > 0 && !(await onConfirm?.(external))) attempt.cancel();
      });
      return {};
    },
  });
