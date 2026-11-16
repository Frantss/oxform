import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm, slots } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { render } from 'solid-js/web';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { createParts } from './create-parts';

type Values = { name: string; tags: string[]; agree: boolean };

const schema = {
  '~standard': { version: 1, vendor: 'oxform-test', validate: (value: unknown) => ({ value }) },
} as StandardSchemaV1<Values>;

/**
 * The standard form, with a `toggle` part that reads a checkbox on `input` only. The `field` slot reads a toggle on
 * `click`, because React puts a controlled one back on `click`; `toggle` shows whether Solid needs that.
 */
const form = defineForm({ schema, defaultValues: { name: '', tags: [], agree: false } })
  .extend(standard)
  .extend(
    slots(slot => ({
      toggle: slot({
        element: 'input',
        props: { name: 'key' },
        attrs: (state, part) => ({
          type: 'checkbox',
          checked: Boolean((state.values as Record<string, unknown>)[part.key]),
        }),
        on: {
          input: (_event, { api, key, element }) => api.values.set(key as 'agree', (element as HTMLInputElement).checked),
        },
      }),
    })),
  );

/** A mounted `Root` with the Field `name`, the Field `tags` as a multiple select, and the Toggle `agree`. */
const setup = () => {
  const parts = createParts(form);
  const instance = form.create();
  const container = document.body.appendChild(document.createElement('div'));
  const dispose = render(
    () => (
      <parts.Root form={instance}>
        <parts.Field name='name' aria-label='Name' />
        <parts.Field name='tags' aria-label='Tags' render={(props: object) => <select multiple {...props} />}>
          <option value='a'>a</option>
          <option value='b'>b</option>
        </parts.Field>
        <parts.Toggle name='agree' aria-label='Agree' />
      </parts.Root>
    ),
    container,
  );
  const element = <Element extends HTMLElement>(label: string) => container.querySelector<Element>(`[aria-label="${label}"]`)!;

  return {
    instance,
    element,
    [Symbol.dispose]: () => {
      dispose();
      container.remove();
    },
  };
};

describe('createParts', () => {
  it('sets a controlled value as a DOM property, also after the user typed', async () => {
    using subject = setup();
    const name = subject.element<HTMLInputElement>('Name');
    await userEvent.fill(name, 'typed');
    subject.instance.values.set('name', 'set');

    expect([name.value, name.getAttribute('value')]).toEqual(['set', null]);
  });

  it('selects the options of a multiple select from a list value', () => {
    using subject = setup();
    subject.instance.values.set('tags', ['a', 'b']);

    expect(Array.from(subject.element<HTMLSelectElement>('Tags').selectedOptions, option => option.value)).toEqual(['a', 'b']);
  });

  it('reads a controlled checkbox on input, with no click listener', async () => {
    using subject = setup();
    const agree = subject.element<HTMLInputElement>('Agree');
    await userEvent.click(agree);
    const afterFirst = [subject.instance.values.get('agree'), agree.checked];
    await userEvent.click(agree);

    expect([afterFirst, [subject.instance.values.get('agree'), agree.checked]]).toEqual([
      [true, true],
      [false, false],
    ]);
  });

  it('throws for an element of a part that the form does not have', () => {
    using _subject = setup();

    expect(() => createParts(form, { nope: 'span' })).toThrow('oxform: the form has no part "nope".');
  });
});
