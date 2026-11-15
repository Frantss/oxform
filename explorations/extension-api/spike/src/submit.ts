import type {
  Extendable,
  FormContext,
  IssuesByCheck,
  MaybePromise,
  Needs,
  Self,
  SubmitApi,
  SubmitAttempt,
  StatusApi,
  SubmitResult,
  ValidationApi,
  ValuesApi,
} from './api';
import { defineExtension, option } from './form';
import { statusInternals } from './status';
import { isDiscarded } from './validation';

type SubmitOptions<Values, Checks extends string, Instance> = {
  readonly onSubmit?: (values: Values, form: Instance, intent?: string) => MaybePromise<unknown>;
  readonly onInvalid?: (issues: IssuesByCheck<Checks>, form: Instance, intent?: string) => MaybePromise<unknown>;
};

export function createSubmit<Values, Checks extends string = string, Instance = unknown>(
  ctx: FormContext,
  deps: {
    readonly values: ValuesApi<Values>;
    readonly validation?: ValidationApi<Values, Checks>;
    readonly status: StatusApi<Values>;
  },
): SubmitApi<Values, Checks> {
  const status = statusInternals(deps.status);
  const interceptors = new Set<(attempt: SubmitAttempt<Values>) => MaybePromise<void>>();
  const listeners = new Set<(result: SubmitResult<Checks>) => void>();
  let active: Promise<void> | undefined;

  async function attempt(intent?: string) {
    const generation = status.generation();
    const options = ctx.options() as SubmitOptions<Values, Checks, Instance>;
    const form = ctx.instance<Instance>();
    let successful: boolean | undefined;
    let canceled = false;

    try {
      const request: SubmitAttempt<Values> = {
        values: deps.values.get(),
        get canceled() {
          return canceled;
        },
        cancel() {
          canceled = true;
        },
      };
      for (const interceptor of interceptors) {
        await interceptor(request);
        if (canceled) break;
      }
      if (canceled) {
        status.setForm({ submitting: false });
        return;
      }

      const snapshot = deps.values.get();
      const outcome = deps.validation
        ? await deps.validation.run(undefined, { type: 'submit' })
        : ([true, {}] as const);
      const aborted = isDiscarded(outcome) || status.generation() !== generation;
      if (!aborted) {
        const issues = (deps.validation?.issues() ?? {}) as IssuesByCheck<Checks>;
        if (outcome[0] && deps.status.form.valid) {
          await options.onSubmit?.(snapshot, form, intent);
          successful = true;
        } else {
          await options.onInvalid?.(issues, form, intent);
          successful = false;
        }
        for (const listener of listeners) listener({ successful, issues });
      }
    } catch (error) {
      successful = false;
      throw error;
    } finally {
      // A reset replaced the status while this attempt ran, so the old attempt must not overwrite it.
      if (!canceled && status.generation() === generation) {
        status.setForm({
          submitting: false,
          submits: deps.status.form.submits + 1,
          ...(successful === undefined ? {} : { successful }),
        });
      }
    }
  }

  return {
    run(intent) {
      if (active) return active;

      status.setForm({ dirty: true, submitting: true });
      active = attempt(intent).finally(() => {
        active = undefined;
      });
      return active;
    },
    intercept(interceptor) {
      interceptors.add(interceptor);
      return () => interceptors.delete(interceptor);
    },
    onResult(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * `submit`: runs validation, then `onSubmit` or `onInvalid`, and records the result in the status. Needs `values` and
 * `status`. `validation` is optional: a form without it submits without validating. The dependency is read when
 * `submit` is extended, so extend `validation` before it.
 */
export const submit = <Values>(
  form: Extendable<Values, Needs<Values, 'values' | 'status'> & { readonly validation?: ValidationApi<Values> }>,
) =>
  defineExtension(form, {
    name: 'submit',
    options: {
      onSubmit: option.action<(values: Values, form: Self, intent?: string) => MaybePromise<unknown>>(),
      onInvalid: option.action<(issues: IssuesByCheck<string>, form: Self, intent?: string) => MaybePromise<unknown>>(),
    },
    api: (ctx, { values, validation, status }) => ({
      submit: createSubmit<Values>(ctx, { values, validation, status }),
    }),
  });
