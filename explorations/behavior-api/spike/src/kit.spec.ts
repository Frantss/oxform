import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withAutosave } from '../../playground/src/kit/autosave';
import { configureForm } from './form';
import { standardForm } from './standard';
import { defaultProfile, failing, schemaOf, type Profile } from './test-helpers';

// The playground's kit: the extensions a team that owns the form system would write once.
describe('withAutosave (playground kit)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const create = (options: Record<string, unknown> = {}) =>
    configureForm(withAutosave(standardForm), {
      schema: schemaOf<Profile>(),
      defaultValues: defaultProfile,
      autosaveDelay: 10,
      saveDraft: vi.fn(),
      ...options,
    } as never)();

  it('is clean until the values change, dirty after a change, and clean again once saved', async () => {
    const form = create();
    expect(form.store.state.autosave.dirty).toBe(false);

    form.values.set('name', 'a');
    expect(form.store.state.autosave.dirty).toBe(true);

    await vi.advanceTimersByTimeAsync(10);
    expect(form.store.state.autosave).toMatchObject({ dirty: false, saving: false, savedAt: expect.any(Date) });
  });

  it('stays dirty when the values are invalid, so the saved time cannot be taken for current', async () => {
    const form = create({ error: { change: failing({ message: 'Bad', path: ['name'] }) } });

    form.values.set('name', 'a');
    await vi.advanceTimersByTimeAsync(10);

    expect(form.store.state.autosave).toMatchObject({ dirty: true, savedAt: null });
  });

  it('is dirty again when the values change during a save', async () => {
    let finish!: () => void;
    const saveDraft = () => new Promise<void>(resolve => (finish = resolve));
    const form = create({ saveDraft });

    form.values.set('name', 'a');
    await vi.advanceTimersByTimeAsync(10);
    form.values.set('name', 'ab');
    finish();
    await vi.advanceTimersByTimeAsync(0);

    expect(form.store.state.autosave).toMatchObject({ dirty: true, saving: false });
  });
});
