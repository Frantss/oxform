import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { createParts } from './create-parts';

const form = defineForm({ schema: {} as StandardSchemaV1<{ name: string }>, defaultValues: { name: '' } }).extend(standard);

/** Renders `view` once to a string, with the parts of `form`. */
const setup = (view: (parts: ReturnType<typeof createParts<typeof form>>) => ReactNode) => ({
  render: () => renderToString(view(createParts(form))),
  [Symbol.dispose]() {},
});

const message = 'oxform: call this inside the Root of the same form object. `configure` returns a new form object.';

describe('useForm', () => {
  it('throws outside a Root', () => {
    using subject = setup(({ useForm }) => {
      const Reader = () => useForm().id;
      return <Reader />;
    });

    expect(subject.render).toThrow(message);
  });

  it('throws inside the Root of another form object', () => {
    using subject = setup(({ useForm }) => {
      const Other = createParts(form.configure({})).Root;
      const Reader = () => useForm().id;
      return (
        <Other>
          <Reader />
        </Other>
      );
    });

    expect(subject.render).toThrow(message);
  });

  it('gives the instance of the Root', () => {
    using subject = setup(({ Root, useForm }) => {
      const Reader = () => useForm().values.get('name');
      return (
        <Root defaultValues={{ name: 'Ada' }}>
          <Reader />
        </Root>
      );
    });

    expect(subject.render()).toContain('Ada');
  });
});
