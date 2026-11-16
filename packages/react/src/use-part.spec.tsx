import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { createParts } from './create-parts';
import type { PartProps } from './types';
import { usePart } from './use-part';

const form = defineForm({ schema: {} as StandardSchemaV1<{ color: string }>, defaultValues: { color: 'red' } }).extend(standard);

/** A wrapper of the `field` slot for a `<select>`: it forwards the part props of its tag. */
const ColorSelect = (props: PartProps<'select'>) => usePart(form, 'field', { name: 'color' }, props, 'select');

/** The parts of `form`, a client root in a container with a test id, and its instance after the first render. */
const setup = () => {
  const { Root, useForm } = createParts(form);
  const container = document.body.appendChild(document.createElement('div'));
  container.dataset.testid = 'use-part';
  const root = createRoot(container);
  const exposed: { instance?: ReturnType<typeof useForm> } = {};
  const expose = (instance: ReturnType<typeof useForm>) => void (exposed.instance = instance);
  const Expose = () => {
    expose(useForm());
    return null;
  };

  return {
    exposed,
    screen: page.getByTestId('use-part'),
    render: (view: ReactNode) =>
      flushSync(() =>
        root.render(
          <Root>
            <Expose />
            {view}
          </Root>,
        ),
      ),
    [Symbol.dispose]: () => {
      root.unmount();
      container.remove();
    },
  };
};

describe('usePart', () => {
  it('renders a slot through a wrapper that forwards the part props, with render and a function child', async () => {
    using subject = setup();
    subject.render(
      <ColorSelect aria-label='Color' render={props => <select {...props} data-wrapped='' />}>
        {() => (
          <>
            <option value='red'>red</option>
            <option value='blue'>blue</option>
          </>
        )}
      </ColorSelect>,
    );
    await userEvent.selectOptions(subject.screen.getByLabelText('Color'), 'blue');

    expect([subject.screen.getByLabelText('Color').element().hasAttribute('data-wrapped'), subject.exposed.instance?.values.get('color')]).toEqual([
      true,
      'blue',
    ]);
  });

  it('throws for a form object that no Root provides', () => {
    using _subject = setup();
    const Other = () => usePart(form.configure({}), 'field', { name: 'color' }, {}, 'select');

    expect(() => renderToString(<Other />)).toThrow(
      'oxform: call this inside the Root of the same form object. `configure` returns a new form object.',
    );
  });

  it('throws for a slot that the form does not have', () => {
    using _subject = setup();
    const Missing = () => usePart(form, 'nope' as never, {} as never, {}, 'div');

    expect(() => renderToString(<Missing />)).toThrow('oxform: the form has no part "nope".');
  });
});
