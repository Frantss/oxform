import type { Path, Unsubscribe } from '#main/path-types';

export type ChangeReason = 'input' | 'programmatic' | 'array' | 'reset' | (string & {});
/** Kept by `01-public-api.md` (3.3). No details carry it since G15 removed `source`; the owner decides its future. */
export type ChangeSource = 'mouse' | 'touch' | 'pen' | 'keyboard' | 'virtual' | 'programmatic' | 'agent';

/** What a caller states about a change. `ValuesApi.set` and `ChangeApi.run` take it (G15). */
export interface ChangeDetailsInput {
  readonly reason?: ChangeReason;
}

/** What an interceptor and a listener get about a change. */
export interface ChangeDetails {
  readonly reason: ChangeReason;
  readonly canceled: boolean;
  /** Refuses the change: no write, and no listener runs. */
  cancel(): void;
}

export interface Change<Values = unknown> {
  readonly path: Path<Values>;
  readonly value: unknown;
}

/** Returns a replacement change, or nothing to keep it. `details.cancel()` refuses the change. */
export type ChangeInterceptor<Values = unknown> = (
  change: Change<Values>,
  details: ChangeDetails,
) => Change<Values> | void;

export type ChangeListener<Values = unknown> = (change: Change<Values>, details: ChangeDetails) => void;

export interface ChangeApi<Values = unknown> {
  /**
   * Runs the interceptors, then `write`, then the listeners, in the order they were added. Returns `false` when an
   * interceptor cancels the change or `write` reports no change.
   */
  run(change: Change<Values>, write: (change: Change<Values>) => boolean, details?: ChangeDetailsInput): boolean;
  intercept(interceptor: ChangeInterceptor<Values>): Unsubscribe;
  onChange(listener: ChangeListener<Values>): Unsubscribe;
}

const subscribe = <Listener>(listeners: Set<Listener>, listener: Listener): Unsubscribe => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** The change pipeline. `createValues` owns the write, so this module has no extension. */
export const createChange = <Values>(): ChangeApi<Values> => {
  const interceptors = new Set<ChangeInterceptor<Values>>();
  const listeners = new Set<ChangeListener<Values>>();

  return {
    run(change, write, input = {}) {
      let canceled = false;
      const details: ChangeDetails = {
        reason: input.reason ?? 'programmatic',
        get canceled() {
          return canceled;
        },
        cancel: () => void (canceled = true),
      };

      let current = change;
      for (const interceptor of interceptors) {
        current = interceptor(current, details) ?? current;
        if (canceled) return false;
      }
      if (!write(current)) return false;
      for (const listener of listeners) listener(current, details);
      return true;
    },
    intercept: interceptor => subscribe(interceptors, interceptor),
    onChange: listener => subscribe(listeners, listener),
  };
};
