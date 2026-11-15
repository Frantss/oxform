import { describe, expect, it, vi } from 'vitest';
import { arrays } from './arrays';
import { check } from './check';
import { events } from './events';
import { adapterControlsOf, defineExtension, defineForm } from './form';
import { handles } from './handles';
import { reset } from './reset';
import { status } from './status';
import { submit } from './submit';
import { defaultProfile, schemaOf, type Profile } from './test-helpers';
import { validation } from './validation';
import { values } from './values';

/** The kernel's extensions in a lean chain, so these specs do not depend on the preset. */
const profileForm = defineForm({ schema: schemaOf<Profile>(), defaultValues: defaultProfile })
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(arrays)
  .extend(reset)
  .extend(submit)
  .extend(handles);

const create = (options: Parameters<typeof profileForm.create>[0] = {}) => profileForm.create(options);

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
    const form = profileForm.configure({ onSubmit: configured }).create();

    adapterControlsOf(form).setOptions({});
    await form.submit.run();

    expect(configured).toHaveBeenCalledTimes(1);
  });

  it('merge a new instance option over a configured one, and keep the configured ones it does not mention', async () => {
    const configured = vi.fn();
    const instance = vi.fn();
    const form = profileForm.configure({ onSubmit: configured, defaultValues: { ...defaultProfile, name: 'Ada' } }).create();

    adapterControlsOf(form).setOptions({ onSubmit: instance });
    await form.submit.run();

    expect(configured).not.toHaveBeenCalled();
    expect(instance).toHaveBeenCalledTimes(1);
    expect(form.values.get('name')).toBe('Ada');
  });

  it('unmount the work in progress and leave the instance usable, so it can mount again', () => {
    const cleanup = vi.fn();
    const form = profileForm
      .extend(extending =>
        defineExtension(extending, {
          name: 'timer',
          api: ctx => (ctx.onDestroy(cleanup), {}),
        }),
      )
      .create();

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
