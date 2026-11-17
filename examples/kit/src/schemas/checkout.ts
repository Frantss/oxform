import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().min(1, 'Enter a street.'),
  city: z.string().min(1, 'Enter a city.'),
  postalCode: z.string().min(1, 'Enter a postal code.'),
});

export type Address = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  email: z.email('Enter an email address.'),
  country: z.string().min(1, 'Choose a country.'),
  region: z.string().min(1, 'Choose a region.'),
  card: z.object({ number: z.string().regex(/^[\d ]{12,23}$/u, 'Enter a card number.') }),
  billing: addressSchema,
  shipping: addressSchema,
});

export type Checkout = z.infer<typeof checkoutSchema>;

export const emptyAddress: Address = { street: '', city: '', postalCode: '' };

export const emptyCheckout: Checkout = {
  email: '',
  country: '',
  region: '',
  card: { number: '' },
  billing: emptyAddress,
  shipping: emptyAddress,
};
