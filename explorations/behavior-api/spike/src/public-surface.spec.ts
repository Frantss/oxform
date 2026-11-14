import { describe, expect, it } from 'vitest';
import { arraysInternals } from './arrays';
import { eventsInternals } from './events';
import { statusInternals } from './status';
import { createProfileForm, deferred, failing, fakeElement } from './test-helpers';

describe('validation read path (public)', () => {
  it('lists the registered checks in registration order', () => {
    const form = createProfileForm();

    expect(form.validation.checks.map(check => [check.name, check.blocking])).toEqual([['error', true]]);
    expect(form.validation.checks[0]).toBe(form.error);
  });

  it('reads current issues by check, at a path and below, without validating', () => {
    const form = createProfileForm();
    form.error.set('address.city', [{ message: 'Bad' }]);
    form.error.set('name', [{ message: 'Required' }]);

    expect(form.validation.issues()).toEqual({ error: expect.arrayContaining([{ message: 'Bad' }, { message: 'Required' }]) });
    expect(form.validation.issues('address' as never)).toEqual({ error: [{ message: 'Bad' }] });
    expect(form.validation.issues('tags' as never)).toEqual({ error: [] });
  });

  it('reports a pending run through validating', async () => {
    const gate = deferred();
    const form = createProfileForm({ error: { blur: gate.schema } });

    const run = form.validation.run(undefined, { type: 'blur' });
    expect(form.validation.validating).toBe(true);
    gate.release();
    await run;

    expect(form.validation.validating).toBe(false);
  });
});

describe('check additions (public)', () => {
  it('says which events it validates', () => {
    const form = createProfileForm({ error: { blur: failing() } });

    expect(form.error.validates('blur')).toBe(true);
    expect(form.error.validates('change')).toBe(false);
  });

  it('clears one path and below, or everything', () => {
    const form = createProfileForm();
    form.error.set('address.city', [{ message: 'Bad' }]);
    form.error.set('name', [{ message: 'Required' }]);

    form.error.clear('address' as never);
    expect(form.error.at('address.city')).toEqual([]);
    expect(form.error.at('name')).toHaveLength(1);

    form.error.clear();
    expect(form.error.at('name')).toEqual([]);
  });
});

describe('internal members stay internal', () => {
  it('keeps status writes off the status api', () => {
    const form = createProfileForm();

    expect(Object.keys(form.status).sort()).toEqual(['at', 'form']);
    expect(form.status).not.toHaveProperty('mark');
    expect(form.status).not.toHaveProperty('setForm');
    expect(form.status).not.toHaveProperty('generation');
  });

  it('keeps ref and ids off the events and arrays apis', () => {
    const form = createProfileForm();

    expect(form.events).not.toHaveProperty('ref');
    expect(form.arrays).not.toHaveProperty('ids');
    expect(form.events).not.toHaveProperty('clearRefs');
  });

  it('still exposes the ref and the ids through the handles', () => {
    const form = createProfileForm();
    const { element } = fakeElement();
    form.events.register('name')(element);

    expect(form.field('name').state.ref).toBe(element);
    expect(form.array('tags').ids).toHaveLength(3);
  });

  it('refuses an api that was not created by the kernel behavior', () => {
    expect(() => statusInternals({})).toThrow(/createFieldStatus/);
    expect(() => eventsInternals({})).toThrow(/createFieldEvents/);
    expect(() => arraysInternals({})).toThrow(/createArray/);
  });
});

describe('reset and refs', () => {
  it('clears registered refs, unless keep.refs or keep.fields says otherwise', () => {
    const form = createProfileForm();
    const { element } = fakeElement();

    form.events.register('name')(element);
    form.reset.all({ keep: { refs: true } });
    expect(form.field('name').state.ref).toBe(element);

    form.reset.all();
    expect(form.field('name').state.ref).toBeNull();

    form.events.register('name')(element);
    form.reset.all({ keep: { fields: true } });
    expect(form.field('name').state.ref).toBe(element);
  });
});
