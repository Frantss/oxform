import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, 'Enter a street.'),
  city: z.string().min(1, 'Enter a city.'),
  postalCode: z.string().min(1, 'Enter a postal code.'),
});

export type Address = z.infer<typeof addressSchema>;

/** The own fields of the checkout. The billing and the shipping address are scopes (E15). */
export const orderSchema = z.object({
  email: z.email('Enter an email address.'),
  country: z.string().min(1, 'Choose a country.'),
  region: z.string().min(1, 'Choose a region.'),
  card: z.object({ number: z.string().regex(/^[\d ]{12,23}$/u, 'Enter a card number.') }),
});

export type Order = z.infer<typeof orderSchema>;

export type Checkout = Order & { billing: Address; shipping: Address };

export const emptyAddress: Address = { street: '', city: '', postalCode: '' };

export const emptyOrder: Order = { email: '', country: '', region: '', card: { number: '' } };

export const emptyCheckout: Checkout = { ...emptyOrder, billing: emptyAddress, shipping: emptyAddress };
