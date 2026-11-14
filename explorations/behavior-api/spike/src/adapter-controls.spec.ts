import { describe, expect, it, vi } from 'vitest';
import { adapterControlsOf, configureForm, defineExtension } from './form';
import { standardForm } from './standard';
import { defaultProfile, schemaOf, type Profile } from './test-helpers';

const create = (options: Record<string, unknown> = {}) =>
  configureForm(standardForm, { schema: schemaOf<Profile>(), defaultValues: defaultProfile, ...options } as never)();

describe('adapter controls', () => {
  it('apply new options to a live instance, merged like the ones at creation', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const form = create({ onSubmit: first });

    adapterControlsOf(form).setOptions({ onSubmit: second });
    await form.submit.run();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('keep the options the form was configured with when an instance option is not given again', async () => {
    const configured = vi.fn();
    const form = create({ onSubmit: configured });

    adapterControlsOf(form).setOptions({});
    await form.submit.run();

    expect(configured).toHaveBeenCalledTimes(1);
  });

  it('unmount the work in progress and leave the instance usable, so it can mount again', () => {
    const cleanup = vi.fn();
    const withTimer = defineExtension<{}, any>({
      name: 'timer',
      api: ctx => (ctx.onDestroy(cleanup), {}),
    });
    const form = configureForm(withTimer(standardForm), {
      schema: schemaOf<Profile>(),
      defaultValues: defaultProfile,
    } as never)() as any;

    adapterControlsOf(form).unmount();
    adapterControlsOf(form).unmount();
    form.field('name').change('Ada');

    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(form.field('name').get()).toBe('Ada');
  });

  it('refuse an object that is not an instance', () => {
    expect(() => adapterControlsOf({})).toThrow(/not an instance/);
  });
});
