import { getOwner } from 'solid-js';

export const requireOwner = (): void => {
  if (!getOwner()) throw new Error('Oxform Solid primitives require a Solid owner (component or createRoot).');
};
