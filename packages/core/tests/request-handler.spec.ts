import { describe, expect, it } from 'vite-plus/test';
import { defineForm } from '#core';
import { slotsOf } from '#core/adapter';
import { standard } from '#core/presets';
import { requiredAt, schemaOf } from './helpers';

type SignUp = { email: string; name: string };

/** One form at module scope, as a server keeps it. */
const signUp = defineForm({ schema: schemaOf<SignUp>(), defaultValues: { email: '', name: '' } })
  .extend(standard)
  .configure({ error: { submit: requiredAt('email', 'Email is required') } });

type ErrorSlot = { present(state: unknown, part: object): boolean; state(state: unknown, part: object): { messages: string[] } };

/** Handles one request: validates the body, and renders the errors of each field from the same instance. */
const handle = async (body: SignUp) => {
  const instance = signUp.create({ defaultValues: body });
  try {
    const [valid] = await instance.validation.run(undefined, { type: 'submit' });
    const slot = slotsOf(signUp).fieldError as unknown as ErrorSlot;
    const errors = Object.fromEntries(
      (['email', 'name'] as const)
        .map(key => [key, { id: instance.id, key, props: {}, api: instance }] as const)
        .filter(([, part]) => slot.present(instance.store.state, part))
        .map(([key, part]) => [key, slot.state(instance.store.state, part).messages]),
    );
    return { status: valid ? 200 : 422, errors, values: instance.values.get() };
  } finally {
    instance.destroy();
  }
};

const setup = () => ({ handle, [Symbol.dispose]() {} });

describe('a request handler', () => {
  it('validates a body and renders its errors from the same instance', async () => {
    using subject = setup();

    expect(await subject.handle({ email: '', name: 'Ada' })).toEqual({
      status: 422,
      errors: { email: ['Email is required'] },
      values: { email: '', name: 'Ada' },
    });
  });

  it('shares nothing between two concurrent requests', async () => {
    using subject = setup();
    const results = await Promise.all([subject.handle({ email: '', name: 'Ada' }), subject.handle({ email: 'grace@example.com', name: 'Grace' })]);

    expect(results.map(({ status, errors, values }) => [status, errors, values.name])).toEqual([
      [422, { email: ['Email is required'] }, 'Ada'],
      [200, {}, 'Grace'],
    ]);
  });
});
