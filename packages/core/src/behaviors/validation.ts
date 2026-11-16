import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineExtension } from '#main/form';
import { contextInternals } from '#main/context';
import type { DeepPartial, Path, Unsubscribe } from '#main/path-types';
import type { Extendable, FormContext, Needs } from '#main/types';
import type { CheckApi, CheckEntry } from './check';
import type { ValuesApi } from './values';

export type ValidationEvent = 'change' | 'blur' | 'focus' | 'submit';

/** What a validator function gets. It has the full values, also for a targeted run (G2). */
export interface ValidatorInput<Values> {
  readonly values: Values;
}

export type CheckValidator<Values> =
  | StandardSchemaV1<DeepPartial<Values>>
  | ((input: ValidatorInput<Values>) => StandardSchemaV1<DeepPartial<Values>>);

/** The validators of a check, by event. */
export type CheckValidators<Values> = { readonly [Event in ValidationEvent]?: CheckValidator<Values> };

export type IssuesByCheck<Checks extends string> = { readonly [Check in Checks]: readonly CheckEntry[] };

export interface ValidationRunOptions {
  /** Runs only the validators of this event. Without it, a run uses every event. */
  readonly type?: ValidationEvent;
}

export interface ValidationRun<Checks extends string> {
  readonly targets: readonly string[] | undefined;
  readonly type: ValidationEvent | undefined;
  readonly valid: boolean;
  readonly issues: IssuesByCheck<Checks>;
}

export interface ValidationApi<Values, Checks extends string = string> {
  /**
   * Resolves `[valid, issues]`. `valid` covers this run only. A run that a change or a newer run made stale is
   * discarded: it applies nothing and resolves valid, with an empty list per check (G3).
   */
  run(
    targets?: Path<Values> | readonly Path<Values>[],
    options?: ValidationRunOptions,
  ): Promise<readonly [valid: boolean, issues: IssuesByCheck<Checks>]>;
  /** Observes each applied run, also those that events and submit start. A discarded or rejected run is not one. */
  onRun(listener: (run: ValidationRun<Checks>) => void): Unsubscribe;
  /** The entries of every check, by check name, at a path and below. It reads the state and never validates. */
  issues(path?: Path<Values>): IssuesByCheck<Checks>;
  /** The checks in registration order. */
  readonly checks: readonly CheckApi<Values, Checks>[];
  /** True while a run is pending. A snapshot: subscribe to the store to follow it. */
  readonly validating: boolean;
}

/** What a check gives `validation` when it registers: the check, and what only a run needs. */
export interface RegisteredCheck {
  readonly check: CheckApi<unknown>;
  validatorFor(event: ValidationEvent): CheckValidator<unknown> | undefined;
  /** Applies the results of one run. `events` are the events that had a validator in the run. */
  refresh(
    events: readonly ValidationEvent[],
    targets: readonly string[] | undefined,
    incoming: ReadonlyMap<string, readonly CheckEntry[]>,
  ): void;
}

type Run = { readonly targets: readonly string[] | undefined; readonly lanes: readonly string[]; stale: boolean };

const EVENTS: readonly ValidationEvent[] = ['change', 'blur', 'focus', 'submit'];

const registries = new WeakMap<object, Set<RegisteredCheck>>();
const discarded = new WeakSet<object>();

/** Adds a check to the runs of a validation api. Only an api that `validation` created takes one. */
export const registerCheck = (validation: object, entry: RegisteredCheck) => {
  const registry = registries.get(validation);
  if (!registry) throw new TypeError('registerCheck expects a validation api made by the validation extension.');
  registry.add(entry);
};

/** True for the result of a discarded run, so a caller such as submit can tell it from a run without issues. */
export const isDiscarded = (result: object) => discarded.has(result);

/** A target holds its descendants. Its ancestors and siblings are out. No target holds every path. */
export const isInScope = (path: string, targets: readonly string[] | undefined) =>
  targets === undefined || targets.some(target => path === target || path.startsWith(`${target}.`));

/** A change makes a run stale when it writes a target, a descendant or an ancestor of a target. */
const overlaps = (changed: string, targets: readonly string[] | undefined) =>
  targets === undefined || targets.some(target => isInScope(changed, [target]) || target.startsWith(`${changed}.`));

const issuePath = (issue: StandardSchemaV1.Issue) =>
  (issue.path ?? []).map(segment => String(typeof segment === 'object' ? segment.key : segment)).join('.');

const laneOf = (targets: readonly string[] | undefined, event: ValidationEvent) =>
  `${targets === undefined ? '*' : [...targets].sort().join(',')}|${event}`;

const append = <Key, Item>(map: Map<Key, Item[]>, key: Key, items: readonly Item[]) =>
  map.set(key, [...(map.get(key) ?? []), ...items]);

/** Runs the registered checks, discards stale runs, and counts the pending runs in the `validating` slice. */
export const createValidation = <Values, Checks extends string = string>(
  context: FormContext<unknown, { validating: number }>,
  deps: { readonly values: ValuesApi<Values> },
): ValidationApi<Values, Checks> => {
  const checks = new Set<RegisteredCheck>();
  const listeners = new Set<(run: ValidationRun<Checks>) => void>();
  const pending = new Set<Run>();
  const counter = context.state.validating;

  deps.values.onChange(change => {
    for (const run of pending) if (overlaps(change.path, run.targets)) run.stale = true;
  });

  const emptyIssues = () =>
    Object.fromEntries([...checks].map(({ check }) => [check.name, []])) as Record<string, CheckEntry[]>;

  const validate = async (entry: RegisteredCheck, event: ValidationEvent, run: Run) => {
    const validator = entry.validatorFor(event);
    if (!validator) return undefined;
    const values = deps.values.get();
    const schema = typeof validator === 'function' ? validator({ values }) : validator;
    const result = await schema['~standard'].validate(values);
    const incoming = new Map<string, CheckEntry[]>();
    for (const issue of result.issues ?? []) {
      const path = issuePath(issue);
      if (isInScope(path, run.targets)) append(incoming, path, [{ ...issue, type: event }]);
    }
    return { check: entry.check, event, incoming };
  };

  const validation: ValidationApi<Values, Checks> = {
    async run(targets, options) {
      const scoped = targets === undefined ? undefined : ([] as string[]).concat(targets);
      const events = options?.type ? [options.type] : EVENTS;
      const run: Run = { targets: scoped, lanes: events.map(event => laneOf(scoped, event)), stale: false };
      for (const other of pending) if (other.lanes.some(lane => run.lanes.includes(lane))) other.stale = true;
      pending.add(run);
      counter.set(count => count + 1);

      try {
        const registered = [...checks];
        const results = await Promise.all(
          registered.flatMap(entry => events.map(event => validate(entry, event, run))),
        );
        const issues = emptyIssues();
        if (run.stale) {
          const result = Object.freeze([true, Object.freeze(issues)] as const);
          discarded.add(result);
          return result as unknown as readonly [boolean, IssuesByCheck<Checks>];
        }

        let valid = true;
        for (const entry of registered) {
          const ran = results.filter(result => result?.check === entry.check);
          if (ran.length === 0) continue;
          const incoming = new Map<string, CheckEntry[]>();
          for (const result of ran) for (const [path, found] of result!.incoming) append(incoming, path, found);
          entry.refresh(
            ran.map(result => result!.event),
            scoped,
            incoming,
          );
          const found = [...incoming.values()].flat();
          issues[entry.check.name] = found;
          if (entry.check.blocking && found.length > 0) valid = false;
        }

        const grouped = issues as unknown as IssuesByCheck<Checks>;
        for (const listener of listeners) listener({ targets: scoped, type: options?.type, valid, issues: grouped });
        return [valid, grouped] as const;
      } finally {
        pending.delete(run);
        counter.set(count => count - 1);
      }
    },
    onRun(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    issues: path =>
      Object.fromEntries(
        [...checks].map(({ check }) => [check.name, check.at((path ?? '') as never, { nested: true })]),
      ) as unknown as IssuesByCheck<Checks>,
    get checks() {
      return [...checks].map(({ check }) => check) as unknown as readonly CheckApi<Values, Checks>[];
    },
    get validating() {
      return counter.get() > 0;
    },
  };

  registries.set(validation, checks);
  return validation;
};

/** `validation`: runs the checks of the form and reports their issues. It needs `values`. */
export const validation = <Values>(form: Extendable<Values, Needs<Values, 'values'>>) =>
  defineExtension(form, {
    name: 'validation',
    needs: { api: ['values'] },
    state: () => ({ validating: 0 }),
    api: (context, { values }) => {
      const api = createValidation<Values>(context, { values });
      contextInternals(context).registerValidation(api);
      return { validation: api };
    },
  });
