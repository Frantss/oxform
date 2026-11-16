import { describe, expect, it, vi } from 'vite-plus/test';
import { defineForm } from '#core';
import { check, events, status, submit, validation, values } from '#core/behaviors';
import { standard } from '#core/presets';
import { requiredAt, schemaOf, settled } from './helpers';

type Login = { email: string; password: string };

const defaultValues: Login = { email: '', password: '' };

const base = () => defineForm({ name: 'login', schema: schemaOf<Login>(), defaultValues });

/** The I9 lean chain: the steps of `standard` that a sign-in form needs, with the same `error` check. */
const lean = () =>
  base()
    .extend(values)
    .extend(validation)
    .extend(check('error', { blocking: true, exclusive: true }))
    .extend(status)
    .extend(events)
    .extend(submit);

const chains = {
  standard: { form: () => base().extend(standard), has: () => true },
  lean: { form: lean, has: (need: string) => need !== 'reset' },
};

/**
 * One instance of a chain, configured like an app: the `error` check requires the email on change and the
 * password on submit, and the callbacks are spies.
 */
const setup = (chain: keyof typeof chains) => {
  const onSubmit = vi.fn();
  const onInvalid = vi.fn();
  const form = (chains[chain].form() as ReturnType<typeof lean>).configure({
    error: { change: requiredAt('email', 'Email'), submit: requiredAt('password', 'Password') },
    onSubmit,
  });
  // The lean chain has no `reset`, and only the scenarios that need it call it.
  const instance = form.create({ onInvalid }) as ReturnType<typeof form.create> & { readonly reset: { all(): void } };

  return { instance, onSubmit, onInvalid, [Symbol.dispose]: () => instance.destroy() };
};

type Scenario = {
  readonly title: string;
  /** The extensions that the scenario needs beyond the lean chain. */
  readonly needs?: 'reset';
  readonly run: (subject: ReturnType<typeof setup>) => Promise<unknown>;
  readonly expected: unknown;
};

const scenarios: readonly Scenario[] = [
  {
    title: 'a change writes the value, marks the field and validates it',
    run: async ({ instance }) => {
      instance.events.change('email', 'ada@example.com');
      instance.events.change('email', '');
      await settled();
      return [instance.values.get('email'), instance.status.at('email').dirty, instance.error.at('email').length];
    },
    expected: ['', true, 1],
  },
  {
    title: 'a blur marks the field blurred and keeps it valid without a blur validator',
    run: async ({ instance }) => {
      instance.events.blur('password');
      await settled();
      return [instance.status.at('password').blurred, instance.status.at('password').valid];
    },
    expected: [true, true],
  },
  {
    title: 'a submit of invalid values calls onInvalid with the issues, and records an unsuccessful submit',
    run: async ({ instance, onInvalid }) => {
      instance.events.change('email', 'ada@example.com');
      await instance.submit.run();
      return [onInvalid.mock.calls[0]?.[0], instance.status.form.successful];
    },
    expected: [{ error: [{ message: 'Password', path: ['password'], type: 'submit' }] }, false],
  },
  {
    title: 'a submit of valid values calls the configured onSubmit with the values',
    run: async ({ instance, onSubmit }) => {
      instance.events.change('email', 'ada@example.com');
      instance.events.change('password', 'secret');
      await instance.submit.run('sign-in');
      return [onSubmit.mock.calls[0]?.[0], onSubmit.mock.calls[0]?.[2], instance.status.form.submits];
    },
    expected: [{ email: 'ada@example.com', password: 'secret' }, 'sign-in', 1],
  },
  {
    title: 'a reset restores the default values, the field state, the issues and the form status',
    needs: 'reset',
    run: async ({ instance }) => {
      instance.events.change('email', '');
      await instance.submit.run();
      instance.reset.all();
      return [instance.values.get(), instance.status.at('email').dirty, instance.error.at('email'), instance.status.form.submits];
    },
    expected: [defaultValues, false, [], 0],
  },
];

describe.each(Object.keys(chains) as (keyof typeof chains)[])('the %s chain', chain => {
  const own = scenarios.filter(scenario => scenario.needs === undefined || chains[chain].has(scenario.needs));

  it.each(own.map(scenario => [scenario.title, scenario] as const))('%s', async (_title, scenario) => {
    using subject = setup(chain);

    expect(await scenario.run(subject)).toEqual(scenario.expected);
  });
});
