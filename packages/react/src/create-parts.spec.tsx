import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createParts } from './create-parts';

const accepting = (validate = vi.fn((value: unknown) => ({ value: value as never }))) => ({
  validate,
  schema: { '~standard': { version: 1, vendor: 'oxform-test', validate } } as StandardSchemaV1<never>,
});

const form = defineForm({ schema: accepting().schema as StandardSchemaV1<{ name: string }>, defaultValues: { name: '' } }).extend(standard);

/**
 * A mounted `Root` with the Field `name`, whose `error` check counts its focus and blur runs. `rootProps` replaces the
 * props of `Root`, which default to that instance.
 */
const setup = (rootProps?: Record<string, unknown>) => {
  const focus = accepting();
  const blur = accepting();
  const { Root, Field } = createParts(form);
  const instance = form.create({ error: { focus: focus.schema, blur: blur.schema } });
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  flushSync(() =>
    root.render(
      <Root {...(rootProps ?? { form: instance })}>
        <Field name='name' aria-label='Name' />
      </Root>,
    ),
  );

  return {
    instance,
    container,
    focus,
    blur,
    [Symbol.dispose]: () => {
      root.unmount();
      container.remove();
    },
  };
};

describe('createParts', () => {
  it('runs focus validation once for a programmatic focus of a registered field', () => {
    using subject = setup();
    subject.instance.field('name').focus();

    expect([subject.focus.validate.mock.calls.length, document.activeElement?.getAttribute('aria-label')]).toEqual([1, 'Name']);
  });

  it('runs blur validation once for a programmatic blur of a registered field', () => {
    using subject = setup();
    subject.instance.field('name').focus();
    subject.instance.field('name').blur();

    expect(subject.blur.validate.mock.calls.length).toBe(1);
  });

  it('gives the onSubmit prop to the element and the onSubmit option to the form', async () => {
    const element = vi.fn();
    const option = vi.fn();
    using subject = setup({ onSubmit: element, options: { onSubmit: option } });
    subject.container.querySelector('form')!.requestSubmit();

    await vi.waitFor(() => expect([element.mock.calls.length, option.mock.calls[0]?.[0]]).toEqual([1, { name: '' }]));
  });

  it('throws for an element of a part that the form does not have', () => {
    using _subject = setup();

    expect(() => createParts(form, { nope: 'span' } as never)).toThrow('oxform: the form has no part "nope".');
  });
});
