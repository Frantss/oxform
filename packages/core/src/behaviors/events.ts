import { contextInternals } from '#main/context';
import { defineExtension } from '#main/form';
import type { Path, PathValue, Updater } from '#main/path-types';
import type { Extendable, FormContext, Needs } from '#main/types';
import { statusInternals } from './status';
import type { StatusApi } from './status';
import type { ValidationEvent } from './validation';
import type { ValuesApi } from './values';

export interface FieldChangeOptions {
  /** Each flag is on by default. `validate` is on when a check has a validator for the event. */
  readonly should?: { readonly dirty?: boolean; readonly touch?: boolean; readonly validate?: boolean };
}

export interface FieldFocusOptions {
  /** `validate` is on when a check has a validator for the event. */
  readonly should?: { readonly validate?: boolean };
}

export interface EventsApi<Values> {
  /** Writes the value, marks the field dirty and touched, and requests change validation. */
  change<At extends Path<Values>>(
    path: At,
    updater: Updater<PathValue<Values, At>>,
    options?: FieldChangeOptions,
  ): void;
  /** Focuses the registered element, marks the field touched, and requests focus validation. */
  focus(path: Path<Values>, options?: FieldFocusOptions): void;
  /** Blurs the registered element, marks the field blurred, and requests blur validation. */
  blur(path: Path<Values>, options?: FieldFocusOptions): void;
  /** A ref callback. `null` keeps the registered element. */
  register(path: Path<Values>): (element: HTMLElement | null) => void;
  /** Forgets the element. The value stays. */
  unregister(path: Path<Values>): void;
}

/** Not on `EventsApi`: a field handle reads its ref, and reset clears the refs. */
export interface EventsInternals {
  ref(path: string): HTMLElement | null;
  clearRefs(): void;
}

const internals = new WeakMap<object, EventsInternals>();

export const eventsInternals = (events: object): EventsInternals => {
  const found = internals.get(events);
  if (!found) throw new TypeError('eventsInternals expects an events api made by the events extension.');
  return found;
};

/** What `events` reads of a check through the validation link. */
type LinkedCheck = { validates(event: ValidationEvent): boolean };

/** Field events. It touches an element only in `focus`, `blur` and `register`. */
export const createEvents = <Values>(
  context: FormContext,
  deps: { readonly values: ValuesApi<Values>; readonly status: StatusApi<Values> },
): EventsApi<Values> => {
  const refs = new Map<string, HTMLElement>();
  const status = statusInternals(deps.status);
  /** The `focus` and `blur` calls that are moving an element (G17). */
  const moving = new Set<string>();

  /**
   * Focuses or blurs the registered element. Its DOM event calls the slot handler, which calls this event again:
   * that inner call does nothing, so status and validation run once. Returns false for the inner call.
   */
  const move = (event: 'focus' | 'blur', path: string) => {
    const call = `${event} ${path}`;
    if (moving.has(call)) return false;
    moving.add(call);
    try {
      refs.get(path)?.[event]();
    } finally {
      moving.delete(call);
    }
    return true;
  };

  /** Requests validation of the event when a check has a validator for it, unless `should` decides. */
  const validate = (path: string, event: ValidationEvent, should?: boolean) => {
    const validation = contextInternals(context).validation();
    if (should ?? (validation.checks as readonly LinkedCheck[]).some(check => check.validates(event))) {
      void validation.run(path, { type: event });
    }
  };

  const events: EventsApi<Values> = {
    change(path, updater, { should = {} } = {}) {
      const { dirty = true, touch = true } = should;
      if (!deps.values.set(path, updater, { reason: 'input' })) return;
      status.mark(path, { ...(dirty ? { dirty: true } : {}), ...(touch ? { touched: true } : {}) });
      validate(path, 'change', should.validate);
    },
    focus(path, options) {
      if (!move('focus', path)) return;
      status.mark(path, { touched: true });
      validate(path, 'focus', options?.should?.validate);
    },
    blur(path, options) {
      if (!move('blur', path)) return;
      status.mark(path, { blurred: true });
      validate(path, 'blur', options?.should?.validate);
    },
    register: path => element => {
      if (element) refs.set(path, element);
    },
    unregister: path => void refs.delete(path),
  };

  internals.set(events, { ref: path => refs.get(path) ?? null, clearRefs: () => refs.clear() });
  return events;
};

/** `events`: `change`, `focus`, `blur` and the element refs. It needs `values` and `status`. */
export const events = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'status'>>) =>
  defineExtension(form, {
    name: 'events',
    needs: { api: ['values', 'status'] },
    api: (context, deps) => ({ events: createEvents<Values>(context, deps) }),
  });
