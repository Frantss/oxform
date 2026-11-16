import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { createParts } from './create-parts';
import type { PartProps } from './types';
import { usePart } from './use-part';

const form = defineForm({ schema: {} as StandardSchemaV1<{ color: string }>, defaultValues: { color: 'red' } }).extend(standard);

/** A wrapper of the `field` slot for a `<select>`: it forwards the part props of its tag. */
const ColorSelect = (props: PartProps<'select'>) => usePart(form, 'field', { name: 'color' }, props, 'select');

/** An instance, and `mount`, which renders a view in a `Root` of it, in a container with a test id. */
const setup = () => {
  const { Root } = createParts(form);
  const instance = form.create();
  const container = document.body.appendChild(document.createElement('div'));
  container.dataset.testid = 'use-part';
  const disposers: (() => void)[] = [];

  return {
    instance,
    screen: page.getByTestId('use-part'),
    mount: (view: () => JSX.Element, root = true) =>
      void disposers.push(render(() => (root ? <Root form={instance}>{view()}</Root> : view()), container)),
    [Symbol.dispose]: () => {
      disposers.forEach(dispose => dispose());
      container.remove();
    },
  };
};

describe('usePart', () => {
  it('renders a slot through a wrapper that forwards the part props, with render and a function child', async () => {
    using subject = setup();
    subject.mount(() => (
      <ColorSelect aria-label='Color' render={props => <select {...props} data-wrapped='' />}>
        {() => (
          <>
            <option value='red'>red</option>
            <option value='blue'>blue</option>
          </>
        )}
      </ColorSelect>
    ));
    await userEvent.selectOptions(subject.screen.getByLabelText('Color'), 'blue');

    expect([subject.screen.getByLabelText('Color').element().hasAttribute('data-wrapped'), subject.instance.values.get('color')]).toEqual([
      true,
      'blue',
    ]);
  });

  it('throws for a form object that no Root provides', () => {
    using subject = setup();

    expect(() => subject.mount(() => usePart(form.configure({}), 'field', { name: 'color' }, {}, 'select'), false)).toThrow(
      'oxform: call this inside the Root of the same form object. `configure` returns a new form object.',
    );
  });

  it('throws for a slot that the form does not have', () => {
    using subject = setup();

    expect(() => subject.mount(() => usePart(form, 'nope' as never, {} as never, {}, 'div'))).toThrow('oxform: the form has no part "nope".');
  });
});
