import type {
  EventsApi,
  FieldChangeOptions,
  FieldFocusOptions,
  FormContext,
  ValidationApi,
  ValidationEvent,
  ValuesApi,
  StatusApi,
} from '../../api';
import { statusInternals } from './status';

/** Not on `EventsApi`. A field handle reads `state.ref`, and reset clears refs, through `eventsInternals(events)`. */
export interface EventsInternals {
  ref(path: string): HTMLElement | null;
  clearRefs(): void;
}

const internals = new WeakMap<object, EventsInternals>();

export function eventsInternals(events: object): EventsInternals {
  const found = internals.get(events);
  if (!found) throw new Error('This behavior needs events created by createFieldEvents.');
  return found;
}

export function createFieldEvents<Values>(
  _ctx: FormContext,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly status: StatusApi<Values>;
    readonly validation?: ValidationApi<Values>;
  },
): EventsApi<Values> {
  const refs = new Map<string, HTMLElement>();
  const status = statusInternals(deps.status);

  /** Requests validation for the event when a check has a validator for it, unless `should.validate` decides. */
  const validate = (path: string, event: ValidationEvent, should?: boolean) => {
    const configured = deps.validation?.checks.some(check => check.validates(event)) ?? false;
    if (!deps.validation || !(should ?? configured)) return;
    void deps.validation.run(path as never, { type: event });
  };

  const events: EventsApi<Values> = {
    change(path, updater, options: FieldChangeOptions = {}) {
      const { dirty = true, touch = true, validate: shouldValidate } = options.should ?? {};
      if (!deps.values.set(path, updater, { reason: 'input' })) return;

      status.mark(path, { ...(dirty ? { dirty: true } : {}), ...(touch ? { touched: true } : {}) });
      validate(path, 'change', shouldValidate);
    },
    focus(path, options: FieldFocusOptions = {}) {
      refs.get(path)?.focus();
      status.mark(path, { touched: true });
      validate(path, 'focus', options.should?.validate);
    },
    blur(path, options: FieldFocusOptions = {}) {
      refs.get(path)?.blur();
      status.mark(path, { blurred: true });
      validate(path, 'blur', options.should?.validate);
    },
    register: path => element => {
      if (element) refs.set(path, element);
    },
    unregister: path => void refs.delete(path),
  };

  internals.set(events, { ref: path => refs.get(path) ?? null, clearRefs: () => refs.clear() });
  return events;
}
