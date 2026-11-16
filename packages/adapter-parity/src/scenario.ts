import type { Driver } from './driver';

/** One parity scenario. It uses only the driver, the DOM, the HTML and the core instance. */
export type Scenario = { readonly title: string; readonly run: (driver: Driver) => Promise<void> };
