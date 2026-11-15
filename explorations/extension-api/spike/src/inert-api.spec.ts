import type { StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { spikeForm } from './spike-form';

type Values = { email: string };

const schemaOf = (): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'spike', validate: value => ({ value: value as Values }) },
});

const rejecting = (validate: () => unknown): StandardSchemaV1<any> => ({
  '~standard': {
    version: 1,
    vendor: 'spike',
    validate: () => (validate(), { issues: [{ message: 'Required', path: ['email'] }] }),
  },
});

afterEach(() => vi.restoreAllMocks());

describe('server rendering rules for api(ctx)', () => {
  it('runs without a window or a document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');

    expect(() => spikeForm({ schema: schemaOf(), defaultValues: { email: '' } }).create()).not.toThrow();
  });

  it('starts no timers or requests when an instance is created', () => {
    const timeout = vi.spyOn(globalThis, 'setTimeout');
    const interval = vi.spyOn(globalThis, 'setInterval');
    const request = vi.spyOn(globalThis, 'fetch');

    spikeForm({ schema: schemaOf(), defaultValues: { email: '' } }).create();

    expect(timeout).not.toHaveBeenCalled();
    expect(interval).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('does not validate on creation', () => {
    const validate = vi.fn();

    spikeForm({ schema: schemaOf(), defaultValues: { email: '' } }).create({
      error: { change: rejecting(validate), blur: rejecting(validate), submit: rejecting(validate) },
    });

    expect(validate).not.toHaveBeenCalled();
  });

  it('shares no state between two instances of one configured definition, even during concurrent runs', async () => {
    const login = spikeForm({ schema: schemaOf(), defaultValues: { email: '' } });
    const options = { error: { submit: rejecting(() => undefined) } };
    const first = login.create(options);
    const second = login.create(options);

    first.values.set('email', 'a');
    const [[firstValid], [secondValid]] = await Promise.all([
      first.validation.run(undefined, { type: 'submit' }),
      second.validation.run(undefined, { type: 'submit' }),
    ]);

    expect([firstValid, secondValid]).toEqual([false, false]);
    expect(second.values.get('email')).toBe('');
    expect(first.error.at('email')).toHaveLength(1);
    expect(first.store).not.toBe(second.store);
  });

  it('renders errors from the same instance after validation (request-handler flow)', async () => {
    const instance = spikeForm({ schema: schemaOf(), defaultValues: { email: '' } }).create({
      defaultValues: { email: 'from-body' },
      error: { submit: rejecting(() => undefined) },
    });

    await instance.validation.run(undefined, { type: 'submit' });

    expect(instance.store.state).toMatchObject({
      values: { email: 'from-body' },
      error: { email: [{ message: 'Required' }] },
    });
  });
});
