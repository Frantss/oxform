import { contextInternals } from '#main/context';
import { defineExtension, option } from '#main/form';
import type { MaybePromise, Unsubscribe } from '#main/path-types';
import type { Extendable, FormContext, Needs, Self, SelfIssues } from '#main/types';
import { statusInternals, type StatusApi } from './status';
import { isDiscarded, type IssuesByCheck } from './validation';
import type { ValuesApi } from './values';

export interface SubmitAttempt<Values> {
  readonly values: Values;
  readonly canceled: boolean;
  /** Stops the submit, for example for a confirmation step. */
  cancel(): void;
}

export interface SubmitResult<Checks extends string> {
  readonly successful: boolean;
  readonly issues: IssuesByCheck<Checks>;
}

export interface SubmitApi<Values = unknown, Checks extends string = string> {
  /**
   * Validates, then calls the `onSubmit` or the `onInvalid` option with the intent, and records the result in the
   * status. It resolves after the callback and the status update, and rejects when the callback or the validation
   * rejects (G16). A call during a submit returns the submit in progress, and its intent is dropped.
   */
  run(intent?: string): Promise<void>;
  /** Runs before validation. `attempt.cancel()` stops the submit. */
  intercept(interceptor: (attempt: SubmitAttempt<Values>) => MaybePromise<void>): Unsubscribe;
  /** Observes each submit that reached a callback. An aborted or canceled submit is not one. */
  onResult(listener: (result: SubmitResult<Checks>) => void): Unsubscribe;
}

/** The options as the behavior calls them: `Self` and `SelfIssues` are types only. */
type SubmitOptions<Values> = {
  readonly onSubmit?: (values: Values, form: never, intent?: string) => MaybePromise<unknown>;
  readonly onInvalid?: (issues: never, form: never, intent?: string) => MaybePromise<unknown>;
};

/**
 * One attempt at a time. A change of the values during validation, a newer validation run or a reset aborts the
 * attempt: no callback runs, and the attempt still settles.
 */
export const createSubmit = <Values, Checks extends string = string>(
  context: FormContext<SubmitOptions<Values>>,
  deps: { readonly values: ValuesApi<Values>; readonly status: StatusApi<Values> },
): SubmitApi<Values, Checks> => {
  const status = statusInternals(deps.status);
  const interceptors = new Set<(attempt: SubmitAttempt<Values>) => MaybePromise<void>>();
  const listeners = new Set<(result: SubmitResult<Checks>) => void>();
  let active: Promise<void> | undefined;

  /** Runs the interceptors. Returns `true` when one of them canceled the attempt. */
  const intercepted = async () => {
    let canceled = false;
    const request: SubmitAttempt<Values> = {
      values: deps.values.get(),
      get canceled() {
        return canceled;
      },
      cancel: () => void (canceled = true),
    };
    for (const interceptor of interceptors) {
      await interceptor(request);
      if (canceled) return true;
    }
    return false;
  };

  const attempt = async (intent?: string) => {
    const generation = status.generation();
    let successful: boolean | undefined;
    try {
      if (await intercepted()) {
        status.setForm({ submitting: false });
        return;
      }
      const validation = contextInternals(context).validation();
      const values = deps.values.get();
      const outcome = await validation.run(undefined, { type: 'submit' });
      if (isDiscarded(outcome) || status.generation() !== generation) return;

      const issues = validation.issues() as IssuesByCheck<Checks>;
      const { onSubmit, onInvalid } = context.options();
      successful = false;
      if (outcome[0] && deps.status.form.valid) {
        await onSubmit?.(values, context.instance<never>(), intent);
        successful = true;
      } else await onInvalid?.(issues as never, context.instance<never>(), intent);
      for (const listener of listeners) listener({ successful, issues });
    } catch (error) {
      successful = false;
      throw error;
    } finally {
      // A reset replaced the status during the attempt, so the attempt does not write over it.
      if (status.generation() === generation && deps.status.form.submitting) {
        status.setForm({
          submitting: false,
          submits: deps.status.form.submits + 1,
          ...(successful === undefined ? {} : { successful }),
        });
      }
    }
  };

  return {
    run(intent) {
      if (active) return active;
      status.setForm({ dirty: true, submitting: true });
      active = attempt(intent).finally(() => (active = undefined));
      return active;
    },
    intercept(interceptor) {
      interceptors.add(interceptor);
      return () => void interceptors.delete(interceptor);
    },
    onResult(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
};

/**
 * `submit`: validates, then calls `onSubmit` or `onInvalid` with the instance, and records the result in the status.
 * It needs `values` and `status`. On a chain without `validation`, every run is valid.
 */
export const submit = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'status'>>) =>
  defineExtension(form, {
    name: 'submit',
    needs: { api: ['values', 'status'] },
    options: {
      onSubmit: option.action<(values: Values, form: Self, intent?: string) => MaybePromise<unknown>>(),
      onInvalid: option.action<(issues: SelfIssues, form: Self, intent?: string) => MaybePromise<unknown>>(),
    },
    api: (context, deps) => ({ submit: createSubmit<Values>(context, deps) }),
  });
