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

/** A mounted `Root` with the Field `name`, whose `error` check counts its focus and blur runs. */
const setup = () => {
  const focus = accepting();
  const blur = accepting();
  const { Root, Field } = createParts(form);
  const instance = form.create({ error: { focus: focus.schema, blur: blur.schema } });
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  flushSync(() =>
    root.render(
      <Root form={instance}>
        <Field name='name' aria-label='Name' />
      </Root>,
    ),
  );

  return {
    instance,
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

  it('throws for an element of a part that the form does not have', () => {
    using _subject = setup();

    expect(() => createParts(form, { nope: 'span' } as never)).toThrow('oxform: the form has no part "nope".');
  });
});
