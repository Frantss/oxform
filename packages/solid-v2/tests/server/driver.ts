import type { Driver } from '@oxform/adapter-parity/driver';
import { renderView } from '../render';

const browserOnly = () => Promise.reject(new Error('The Solid 2 server driver renders strings only.'));

/** The Solid 2 driver of the parity scenarios in Node. */
export const driver: Driver = {
  mount: browserOnly,
  renderToString: async (view, props = {} as never) => renderView(view, props) as never,
  hydrate: browserOnly,
};
