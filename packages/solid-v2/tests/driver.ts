import type { Driver, Mounted, ViewName } from '@oxform/adapter-parity/driver';
import { createSignal, flush, merge } from 'solid-js';
import { createComponent, hydrate, render, type JSX } from '@solidjs/web';
import { commands } from 'vite-plus/test/browser';
import { session, viewOf } from './session';

/** The command of `vite.config.ts` that renders a view on the server: Solid renders no string in a browser. */
const server = commands as unknown as { renderView(view: ViewName, props: object): Promise<string> };

/** Starts a view in `container` with `run`, which is `render` or `hydrate`. Its props are a signal. */
const start = (
  view: ViewName,
  props: object,
  container: HTMLElement,
  run: (code: () => JSX.Element, element: HTMLElement) => () => void,
  strict = false,
): Mounted<any> => {
  const View = viewOf(view);
  const state = session();
  const [current, setCurrent] = createSignal(props);
  // Solid 2 batches its updates: `flush` applies them to the DOM now.
  const mount = () => flush(() => run(() => createComponent(View, merge(state.base, current)), container));
  let dispose = mount();
  // Solid has no strict mode, so a strict mount mounts, unmounts and mounts.
  if (strict) {
    dispose();
    dispose = mount();
  }
  let unmounted = false;
  const unmount = async () => {
    if (unmounted) return;
    unmounted = true;
    dispose();
    container.remove();
  };
  return {
    container,
    get instance() {
      return state.instance;
    },
    rerender: async (next: object) => void flush(() => setCurrent(() => next)),
    renders: (probe: string) => state.counts.get(probe) ?? 0,
    unmount,
    [Symbol.asyncDispose]: unmount,
  } as Mounted<any>;
};

/** The Solid 2 driver of the parity scenarios in the browser. */
export const driver: Driver = {
  mount: async (view, props = {} as never, options = {}) =>
    start(view, props, document.body.appendChild(document.createElement('div')), render, options.strict),
  renderToString: async (view, props = {} as never) => ({
    html: await server.renderView(view, props),
    instance: undefined as never,
  }),
  hydrate: async (container, view, props = {} as never) => {
    // The registry of events and completed nodes that the hydration script of the server page makes.
    Object.assign(globalThis, { _$HY: { events: [], completed: new WeakSet(), r: {}, fe() {} } });
    return start(view, props, container, hydrate);
  },
};
