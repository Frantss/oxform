import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  CheckApi,
  CheckEntry,
  CheckValidator,
  Extendable,
  FormContext,
  IssuesByCheck,
  Needs,
  StatusState,
  ValidationApi,
  ValidationEvent,
  ValidationRun,
  ValuesApi,
} from './api';
import { defineExtension } from './form';

const EVENTS: readonly ValidationEvent[] = ['change', 'blur', 'focus', 'submit'];

/**
 * What `createCheck` hands to `createValidation`: the public check, plus what only a run needs. This registration
 * is the one implicit link left. Everything else reads checks through the public `validation.checks`.
 */
export interface RegisteredCheck {
  readonly check: CheckApi<any, string>;
  validatorFor(event: ValidationEvent): CheckValidator<any> | undefined;
  /** Applies one run's results. `events` are the events that had a validator in this run. */
  refresh(
    events: readonly ValidationEvent[],
    targets: readonly string[] | undefined,
    incoming: Map<string, CheckEntry[]>,
  ): void;
}

interface InFlightRun {
  readonly targets: readonly string[] | undefined;
  readonly laneKeys: readonly string[];
  stale: boolean;
}

const registries = new WeakMap<object, Set<RegisteredCheck>>();

export function registerCheck(validation: object, entry: RegisteredCheck) {
  registries.get(validation)?.add(entry);
}

/** A discarded run resolves to this one tuple, so a caller (submit) can tell it from a run with no issues. */
const DISCARDED = Object.freeze([true, Object.freeze({})]) as unknown as readonly [boolean, IssuesByCheck<string>];
export const isDiscarded = (result: unknown) => result === DISCARDED;

/** A target includes its descendants, and excludes ancestors and siblings. */
export const isInScope = (path: string, targets: readonly string[] | undefined) =>
  targets === undefined || targets.some(target => path === target || path.startsWith(`${target}.`));

/** A change overlaps a run when it writes a target, a descendant or an ancestor of a target. */
const overlaps = (changed: string, targets: readonly string[] | undefined) =>
  targets === undefined ||
  changed === '' ||
  targets.some(target => changed === target || changed.startsWith(`${target}.`) || target.startsWith(`${changed}.`));

const issuePath = (issue: StandardSchemaV1.Issue) =>
  (issue.path ?? []).map(key => (typeof key === 'object' ? key.key : key)).join('.');

const laneKey = (targets: readonly string[] | undefined, event: ValidationEvent) =>
  `${targets === undefined ? '*' : [...targets].sort().join(',')}|${event}`;

/** The behavior. It owns the `validating` counter, and runs every check that registered with it. */
export function createValidation<Values, Checks extends string = string>(
  ctx: FormContext<unknown, { validating: number }>,
  deps: { readonly values: ValuesApi<Values> },
): ValidationApi<Values, Checks> {
  const checks = new Set<RegisteredCheck>();
  const listeners = new Set<(run: ValidationRun<Checks>) => void>();
  const inFlight = new Set<InFlightRun>();
  /** The number of pending runs, in the state so the derived status (and its subscribers) see it change. */
  const pending = ctx.state.validating;

  deps.values.onChange(change => {
    for (const run of inFlight) if (overlaps(change.path, run.targets)) run.stale = true;
  });

  const validation: ValidationApi<Values, Checks> = {
    async run(targets, options) {
      const scoped = targets === undefined ? undefined : ([] as string[]).concat(targets as string | string[]);
      const events = options?.type ? [options.type] : EVENTS;
      const run: InFlightRun = {
        targets: scoped,
        laneKeys: events.map(event => laneKey(scoped, event)),
        stale: false,
      };

      // A newer run for the same targets and event supersedes older ones.
      for (const other of inFlight) if (other.laneKeys.some(key => run.laneKeys.includes(key))) other.stale = true;
      inFlight.add(run);
      pending.set(count => count + 1);

      try {
        const store = { values: deps.values.get(), status: { form: {}, fields: {} } as unknown as StatusState };
        const units = [...checks].flatMap(check => events.map(event => ({ check, event })));
        const results = await Promise.all(
          units.map(async ({ check, event }) => {
            const validator = check.validatorFor(event);
            if (!validator) return undefined;

            const schema = typeof validator === 'function' ? validator(store) : validator;
            const result = await schema['~standard'].validate(store.values);
            const incoming = new Map<string, CheckEntry[]>();
            for (const issue of result.issues ?? []) {
              const path = issuePath(issue);
              if (!isInScope(path, scoped)) continue;
              incoming.set(path, [...(incoming.get(path) ?? []), { ...issue, type: event }]);
            }
            return { check, event, incoming };
          }),
        );

        if (run.stale) return DISCARDED as unknown as readonly [boolean, IssuesByCheck<Checks>];

        const emitted: Record<string, CheckEntry[]> = Object.fromEntries(
          [...checks].map(entry => [entry.check.name, []]),
        );
        let valid = true;
        // One refresh per check, so an exclusive check replaces its entries once and keeps every event's issues.
        for (const check of checks) {
          const ran = results.filter(result => result?.check === check);
          if (ran.length === 0) continue;

          const incoming = new Map<string, CheckEntry[]>();
          for (const result of ran)
            for (const [path, entries] of result!.incoming)
              incoming.set(path, [...(incoming.get(path) ?? []), ...entries]);

          check.refresh(
            ran.map(result => result!.event),
            scoped,
            incoming,
          );
          const entries = [...incoming.values()].flat();
          emitted[check.check.name]!.push(...entries);
          if (check.check.blocking && entries.length > 0) valid = false;
        }

        const grouped = emitted as unknown as IssuesByCheck<Checks>;
        for (const listener of listeners) listener({ targets: scoped, type: options?.type, valid, issues: grouped });
        return [valid, grouped] as const;
      } finally {
        inFlight.delete(run);
        pending.set(count => count - 1);
      }
    },
    onRun(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    issues(path) {
      return Object.fromEntries(
        [...checks].map(({ check }) => [check.name, check.at((path ?? '') as never, { nested: true })]),
      ) as unknown as IssuesByCheck<Checks>;
    },
    get checks() {
      return [...checks].map(entry => entry.check) as unknown as readonly CheckApi<Values, Checks>[];
    },
    get validating() {
      return pending.get() > 0;
    },
  };

  registries.set(validation, checks);
  return validation;
}

/**
 * `validation`: runs the checks and reports their issues. Needs `values`. A check (`check('error')`) registers with it
 * when it is extended, so extend `validation` first.
 */
export const validation = <Values>(form: Extendable<Values, Needs<Values, 'values'>>) =>
  defineExtension(form, {
    name: 'validation',
    state: () => ({ validating: 0 }),
    api: (ctx, { values }) => ({ validation: createValidation<Values>(ctx, { values }) }),
  });
