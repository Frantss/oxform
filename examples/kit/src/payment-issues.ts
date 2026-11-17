import type { InstanceOf } from '@oxform/core';
import type { checkout } from './checkout';
import { payments, type PaymentIssue } from './services';
import type { Checkout } from './schemas/checkout';

type CheckoutForm = InstanceOf<typeof checkout>;

/**
 * E20. The payment service returns its errors as a list of paths. Code outside a component needs a bound field for
 * each one, so it uses the handles of the form.
 */
export const applyPaymentIssues = (form: CheckoutForm, issues: readonly PaymentIssue[]) => {
  for (const issue of issues) form.field(issue.path).setError([{ message: issue.message }]);
};

/** The `onSubmit` of the checkout: it charges the order and shows what the payment service refused. */
export const payOrder = async (order: Checkout, form: CheckoutForm) =>
  applyPaymentIssues(form, (await payments.charge(order)).issues);
