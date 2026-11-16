import type { Driver, Mounted, ViewName, ViewProps } from '@oxform/adapter-parity/driver';
import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { views } from './views';

/** Calls `onCommit` after each commit of the tree. It renders no element, so the server HTML does not change. */
const Committed = ({ onCommit, children }: { readonly onCommit: () => void; readonly children: ReactNode }) => {
  useEffect(onCommit);
  return children;
};

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

const treeOf = (view: ViewName, props: object, base: ViewProps, onCommit: () => void, strict = false) => {
  const View = views[view] as ((props: object) => ReactNode) | undefined;
  if (!View) throw new Error(`The React parity driver has no "${view}" view.`);
  const tree = (
    <Committed onCommit={onCommit}>
      <View {...base} {...props} />
    </Committed>
  );
  return strict ? <StrictMode>{tree}</StrictMode> : tree;
};

/** Renders the tree and resolves after it committed. */
const committed = (render: (onCommit: () => void) => void) => new Promise<void>(resolve => render(resolve));

const mountedOf = (
  root: Root,
  container: HTMLElement,
  state: ReturnType<typeof session>,
  render: (props: object) => Promise<void>,
) => {
  let unmounted = false;
  const unmount = async () => {
    if (unmounted) return;
    unmounted = true;
    root.unmount();
    container.remove();
  };
  return {
    container,
    get instance() {
      return state.instance;
    },
    rerender: render,
    renders: (probe: string) => state.counts.get(probe) ?? 0,
    unmount,
    [Symbol.asyncDispose]: unmount,
  } as Mounted<any>;
};

/** The React driver of the parity scenarios. */
export const driver: Driver = {
  mount: async (view, props = {} as never, options = {}) => {
    const state = session();
    const container = document.body.appendChild(document.createElement('div'));
    const root = createRoot(container);
    const render = (next: object) =>
      committed(onCommit => root.render(treeOf(view, next, state.base, onCommit, options.strict)));
    await render(props);
    return mountedOf(root, container, state, render);
  },
  renderToString: async (view, props = {} as never) => {
    const state = session();
    const html = renderToString(treeOf(view, props, state.base, () => {}));
    return { html, instance: state.instance as never };
  },
  hydrate: async (container, view, props = {} as never) => {
    const state = session();
    let root!: Root;
    await committed(onCommit => (root = hydrateRoot(container, treeOf(view, props, state.base, onCommit))));
    const render = (next: object) => committed(onCommit => root.render(treeOf(view, next, state.base, onCommit)));
    return mountedOf(root, container, state, render);
  },
};
