import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { createParts } from './create-parts';

type Values = { name: string; address: { city: string } };

const form = defineForm({ schema: {} as StandardSchemaV1<Values>, defaultValues: { name: '', address: { city: '' } } }).extend(standard);

/**
 * The parts of `form`, a string render of a view, and a client root that renders views one after another. Disposing
 * unmounts the root and removes its container.
 */
const setup = () => {
  const parts = createParts(form);
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);

  return {
    parts,
    toString: (view: ReactNode) => () => renderToString(view),
    render: (view: ReactNode) => flushSync(() => root.render(view)),
    [Symbol.dispose]: () => {
      root.unmount();
      container.remove();
    },
  };
};

const message = 'oxform: call this inside the Root of the same form object. `configure` returns a new form object.';

describe('useForm', () => {
  it('throws outside a Root', () => {
    using subject = setup();
    const Reader = () => subject.parts.useForm().id;

    expect(subject.toString(<Reader />)).toThrow(message);
  });

  it('throws inside the Root of another form object', () => {
    using subject = setup();
    const Other = createParts(form.configure({})).Root;
    const Reader = () => subject.parts.useForm().id;

    expect(
      subject.toString(
        <Other>
          <Reader />
        </Other>,
      ),
    ).toThrow(message);
  });

  it('gives the instance of the Root', () => {
    using subject = setup();
    const { Root, useForm } = subject.parts;
    const Reader = () => useForm().values.get('name');

    expect(
      subject.toString(
        <Root defaultValues={{ name: 'Ada', address: { city: '' } }}>
          <Reader />
        </Root>,
      )(),
    ).toContain('Ada');
  });
});

describe('useScope', () => {
  it('returns the same scope across renders for the same prefix', () => {
    using subject = setup();
    const { Root, useScope } = subject.parts;
    const scopes: unknown[] = [];
    const Reader = ({ render }: { readonly render: number }) => {
      scopes.push(useScope('address'));
      return render;
    };
    for (const render of [1, 2]) {
      subject.render(
        <Root>
          <Reader render={render} />
        </Root>,
      );
    }

    expect([scopes.length, scopes[0] === scopes[1]]).toEqual([2, true]);
  });
});
