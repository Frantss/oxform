import type { ViewName } from '@oxform/adapter-parity/driver';
import { mergeProps } from 'solid-js';
import { createComponent, renderToString } from 'solid-js/web';
import { session, viewOf } from './session';

/** The server HTML of a view, and the instance that it exposed. It needs the server build of Solid. */
export const renderView = (view: ViewName, props: object) => {
  const View = viewOf(view);
  const state = session();
  const html = renderToString(() => createComponent(View, mergeProps(state.base, props)));
  return { html, instance: state.instance };
};
