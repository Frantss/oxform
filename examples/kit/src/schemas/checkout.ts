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

/** The countries that the shop ships to, with their regions and the shipping price. */
export const countries = [
  { code: 'GB', name: 'United Kingdom', shipping: 0, regions: ['England', 'Northern Ireland', 'Scotland', 'Wales'] },
  { code: 'FR', name: 'France', shipping: 12, regions: ['Bretagne', 'Normandie', 'Occitanie'] },
] as const;

export const countryOf = (code: string) => countries.find(country => country.code === code);
