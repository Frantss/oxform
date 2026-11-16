import { expect, vi } from 'vite-plus/test';
import { signIn } from './fixtures';
import { normalizeHtml } from './normalize';
import type { Scenario } from './scenario';

/** The stored server HTML of one state of the quick start form, shared by every adapter. */
const snapshotOf = (name: string) => new URL(`./snapshots/${name}.html`, import.meta.url).pathname;

/** A schema that counts its runs and accepts every value. */
const counting = () => {
  const validate = vi.fn((value: unknown) => ({ value: value as never }));
  return { validate, schema: { '~standard': { version: 1 as const, vendor: 'oxform-parity', validate } } };
};

/** The parity scenarios that run in Node, by id (`03-testing.md#Adapter tests: the parity suite`). */
export const serverScenarios = {
  P10: {
    title:
      'the server HTML of the quick start form matches the stored snapshots of its values, aria and disabled state',
    run: async driver => {
      const initial = await driver.renderToString('signIn', {
        root: { defaultValues: { email: 'ada@example.com', password: '' } },
      });
      const instance = signIn.create({ id: 'sign-in' });
      await instance.submit.run();
      const invalid = await driver.renderToString('signIn', { root: { form: instance } });
      const submitting = instance.submit.run();
      const pending = await driver.renderToString('signIn', { root: { form: instance } });
      await submitting;

      await expect(normalizeHtml(initial.html, initial.instance.id)).toMatchFileSnapshot(snapshotOf('sign-in'));
      await expect(normalizeHtml(invalid.html, instance.id)).toMatchFileSnapshot(snapshotOf('sign-in-invalid'));
      await expect(normalizeHtml(pending.html, instance.id)).toMatchFileSnapshot(snapshotOf('sign-in-submitting'));
    },
  },
  P12: {
    title: 'two concurrent server renders of one form share no state',
    run: async driver => {
      const [first, second] = await Promise.all(
        ['ada@example.com', 'grace@example.com'].map(email =>
          driver.renderToString('signIn', { root: { defaultValues: { email, password: '' } } }),
        ),
      );

      expect([
        first.instance === second.instance,
        first.html.includes('ada@example.com') && !first.html.includes('grace@example.com'),
        second.html.includes('grace@example.com') && !second.html.includes('ada@example.com'),
      ]).toEqual([false, true, true]);
    },
  },
  P13: {
    title: 'a server render starts no subscription, validation, timer or effect',
    run: async driver => {
      const check = counting();
      const instance = signIn.create({
        id: 'sign-in',
        error: { change: check.schema, blur: check.schema, focus: check.schema },
      });
      const subscribe = vi.spyOn(instance.store, 'subscribe');
      const timeout = vi.spyOn(globalThis, 'setTimeout');
      const interval = vi.spyOn(globalThis, 'setInterval');
      try {
        await driver.renderToString('signIn', { root: { form: instance } });

        expect([
          subscribe.mock.calls.length,
          timeout.mock.calls.length,
          interval.mock.calls.length,
          check.validate.mock.calls.length,
        ]).toEqual([0, 0, 0, 0]);
        expect(instance.status.form.validating).toBe(false);
      } finally {
        timeout.mockRestore();
        interval.mockRestore();
      }
    },
  },
} satisfies Record<string, Scenario>;
