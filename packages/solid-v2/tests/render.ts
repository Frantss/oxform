import type { ViewName } from '@oxform/adapter-parity/driver';
import { merge } from 'solid-js';
import { createComponent, renderToString } from '@solidjs/web';
import { session, viewOf } from './session';

/** The server HTML of a view, and the instance that it exposed. It needs the server build of Solid. */
export const renderView = (view: ViewName, props: object) => {
  const View = viewOf(view);
  const state = session();
  // A function source, as in the browser driver: each makes the same owners, so the hydration keys match.
  const html = renderToString(() =>
    createComponent(
      View,
      merge(state.base, () => props),
    ),
  );
  return { html, instance: state.instance };
};
