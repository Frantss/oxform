import type { ViewName, ViewProps } from '@oxform/adapter-parity/driver';
import type { Component } from 'solid-js';
import { views } from './views';

/** What the views of one mount report: the instance they expose and the renders they count. */
export const session = () => {
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

export const viewOf = (view: ViewName) => {
  const View = views[view] as Component<object> | undefined;
  if (!View) throw new Error(`The Solid 1 parity driver has no "${view}" view.`);
  return View;
};
