import type {
  Change,
  ChangeApi,
  ChangeDetails,
  ChangeInterceptor,
  ChangeListener,
  FormContext,
  Unsubscribe,
} from '../../api';

function subscribe<Listener>(listeners: Set<Listener>, listener: Listener): Unsubscribe {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function createChange<Values = unknown>(_ctx: FormContext): ChangeApi<Values> {
  const interceptors = new Set<ChangeInterceptor<Values>>();
  const listeners = new Set<ChangeListener<Values>>();

  return {
    run(change, write, partial = {}) {
      let canceled = false;
      const details: ChangeDetails = {
        reason: partial.reason ?? 'programmatic',
        source: partial.source ?? 'programmatic',
        event: partial.event,
        get canceled() {
          return canceled;
        },
        cancel() {
          canceled = true;
        },
      };

      let current: Change<Values> = change;
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
}
