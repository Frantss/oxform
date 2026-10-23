import { ArrayField, Field, Subscribe, createArrayField, createField, createForm, createFormEffect, createSubscribe } from '@oxform/solid/v2';
import { createRoot } from 'solid-js';
import { renderToString } from '@solidjs/web';
import { expect, it, vi } from 'vite-plus/test';
import z from 'zod';

const schema = z.object({ name: z.string(), tags: z.string().array() });

it('should render initial values with each request owning its form state', () => {
  const renderName = (name: string) =>
    renderToString(() => {
      const form = createForm({ schema, defaultValues: { name, tags: ['one'] } });
      return [
        Field({ form, name: 'name', children: field => field.props.value }),
        ArrayField({ form, name: 'tags', children: array => array.state.value.join(', ') }),
        Subscribe({ api: form, selector: state => state.status.valid, children: valid => String(valid()) }),
      ];
    });
  expect(renderName('Ada')).toContain('Ada');
  expect(renderName('Grace')).toContain('Grace');
  expect(renderName('Grace')).not.toContain('Ada');
});

it('should avoid subscriptions, validation and effect callbacks during server rendering', () =>
  createRoot(dispose => {
    const form = createForm({ schema, defaultValues: { name: 'Ada', tags: ['one'] } });
    const subscribe = vi.spyOn(form.store, 'subscribe');
    const callback = vi.fn();
    const name = createSubscribe(form, state => state.values.name);
    const field = createField({ form, name: 'name' });
    const array = createArrayField({ form, name: 'tags' });
    createFormEffect(form, state => state.values.name, callback);
    expect(name()).toBe('Ada');
    expect(field.value).toBe('Ada');
    expect(array.ids).toHaveLength(1);
    expect(subscribe).not.toHaveBeenCalled();
    form.field.change('name', 'Grace');
    expect(callback).not.toHaveBeenCalled();
    expect(form.status.submits).toBe(0);
    dispose();
  }));
