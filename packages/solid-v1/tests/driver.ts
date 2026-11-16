import type { Driver, Mounted, ViewName, ViewProps } from '@oxform/adapter-parity/driver';
import { createSignal, mergeProps, type Component } from 'solid-js';
import { createComponent, render } from 'solid-js/web';
import { views } from './views';

/** What the views of one mount report: the instance they expose and the renders they count. */
const session = () => {
  const counts = new Map<string, number>();
  const state = {
    instance: undefined as unknown,
    counts,
    base: {
      expose: (instance: unknown) => void (state.instance = instance),
      count: (probe: string) => void counts.set(probe, (counts.get(probe) ?? 0) + 1),
    } satisfies ViewProps,
  };
  return state;
};

const viewOf = (view: ViewName) => {
  const View = views[view] as Component<object> | undefined;
  if (!View) throw new Error(`The Solid 1 parity driver has no "${view}" view.`);
  return View;
};

/** The Solid 1 driver of the parity scenarios. The props of a view are a signal, so `rerender` updates them. */
export const driver: Driver = {
  mount: async (view, props = {} as never, options = {}) => {
    const View = viewOf(view);
    const state = session();
    const container = document.body.appendChild(document.createElement('div'));
    const [current, setCurrent] = createSignal<object>(props);
    const start = () => render(() => createComponent(View, mergeProps(state.base, current)), container);
    let dispose = start();
    // Solid has no strict mode, so a strict mount mounts, unmounts and mounts.
    if (options.strict) {
      dispose();
      dispose = start();
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
      rerender: async (next: object) => void setCurrent(() => next),
      renders: (probe: string) => state.counts.get(probe) ?? 0,
      unmount,
      [Symbol.asyncDispose]: unmount,
    } as Mounted<any>;
  },
  renderToString: () => Promise.reject(new Error('The Solid 1 server driver is TK-044.')),
  hydrate: () => Promise.reject(new Error('The Solid 1 hydration driver is TK-044.')),
};
