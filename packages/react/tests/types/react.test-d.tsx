import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm, slots, type ElementTag, type InstanceOf, type PartsOf } from '@oxform/core';
import { events, fieldSlots, status, values, type FieldHandle } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';
import {
  createParts,
  usePart,
  type FormHooks,
  type PartComponent,
  type PartComponents,
  type PartElements,
  type PartProps,
  type PartRender,
  type RootComponent,
  type RootProps,
} from '@oxform/react';
import type { JSX } from 'react';
import { describe, expectTypeOf, it } from 'vite-plus/test';

type Profile = { name: string; color: string; address: { city: string } };

const form = defineForm({
  schema: {} as StandardSchemaV1<Profile>,
  defaultValues: { name: '', color: '', address: { city: '' } },
}).extend(standard);
const bare = defineForm({
  schema: {} as StandardSchemaV1<Profile>,
  defaultValues: { name: '', color: '', address: { city: '' } },
})
  .extend(values)
  .extend(status)
  .extend(events)
  .extend(slots(slot => fieldSlots(slot)));

const parts = createParts(form);
const instance = form.create();
const accepts = <Type,>(value: Type): Type => value;

describe('createParts', () => {
  it('gives Root, one component per slot and the hooks', () => {
    expectTypeOf(parts.Field).toEqualTypeOf<PartComponent<typeof form, 'field', 'input'>>();
    expectTypeOf(parts.Root).toEqualTypeOf<RootComponent<typeof form, {}>>();
    expectTypeOf(parts.useForm).toEqualTypeOf<FormHooks<typeof form>['useForm']>();
  });

  it('renders a part in the element that the caller chooses', () => {
    const { Field } = createParts(form, { field: 'textarea' });
    expectTypeOf(Field).toEqualTypeOf<PartComponent<typeof form, 'field', 'textarea'>>();
  });

  it('rejects an element for a slot that the form does not have', () => {
    // @ts-expect-error The form has no `nope` slot.
    createParts(form, { nope: 'span' });
  });
});

describe('usePart', () => {
  it('renders a slot in the element of a tag, and a wrapper forwards the part props of the tag', () => {
    const ColorSelect = (props: PartProps<'select'>) => usePart(form, 'field', { name: 'color' }, props, 'select');
    expectTypeOf(ColorSelect).returns.toEqualTypeOf<JSX.Element>();
  });

  it('rejects a key that is not a path of the form', () => {
    // @ts-expect-error `nope` is not a path of Profile.
    usePart(form, 'field', { name: 'nope' }, {}, 'select');
  });
});

describe('PartElements', () => {
  it('takes an element per slot', () => {
    expectTypeOf<PartElements<PartsOf<typeof form>>['field']>().toEqualTypeOf<ElementTag | undefined>();
    expectTypeOf<ElementTag>().toExtend<keyof JSX.IntrinsicElements>();
  });

  it('rejects a tag that is not an HTML element', () => {
    // @ts-expect-error `nope` is not an element tag.
    accepts<PartElements<PartsOf<typeof form>>>({ field: 'nope' });
  });
});

describe('PartRender', () => {
  it('is an element or a function of the props and the state', () => {
    accepts<PartRender<{ messages: string[] }>>((props, state) => <p {...props}>{state.messages[0]}</p>);
    accepts<PartRender<{}>>(<textarea />);
  });

  it('rejects a string', () => {
    // @ts-expect-error A render is an element or a function.
    accepts<PartRender<{}>>('textarea');
  });
});

describe('PartProps', () => {
  it('takes the props of the element, the slot props, a function child and render', () => {
    expectTypeOf<PartProps<'select'>['multiple']>().toEqualTypeOf<boolean | undefined>();
    accepts<PartProps<'p', {}, { messages: string[] }>>({ children: state => state.messages[0] });
  });

  it('rejects a prop that the element does not have', () => {
    // @ts-expect-error A select has no `rows`.
    accepts<PartProps<'select'>>({ rows: 2 });
  });
});

describe('PartComponent', () => {
  it('takes a path of the form, or a path of a scope with the scope', () => {
    const scope = instance.scope('address');
    accepts(<parts.Field name='name' />);
    accepts(<parts.Field name='city' scope={scope} />);
  });

  it('rejects a path that the form does not have', () => {
    // @ts-expect-error `nope` is not a path of Profile.
    accepts(<parts.Field name='nope' />);
  });

  it('gives the children of the error part its messages', () => {
    accepts(
      <parts.FieldError name='name'>
        {({ messages }) => messages.map(message => message.toUpperCase())}
      </parts.FieldError>,
    );
  });
});

describe('PartComponents', () => {
  it('has one component per slot except root, named by the capitalized slot name', () => {
    expectTypeOf<keyof PartComponents<typeof form, {}>>().toEqualTypeOf<'Field' | 'FieldError' | 'Submit' | 'Reset'>();
  });

  it('has no Root', () => {
    // @ts-expect-error `Root` is not a part component.
    accepts<PartComponents<typeof form, {}>['Root']>(null);
  });
});

describe('RootProps', () => {
  it('takes the options of the form in options, or an existing instance', () => {
    accepts<RootProps<typeof form>>({ options: { defaultValues: { name: 'Ada', color: '', address: { city: '' } } } });
    accepts<RootProps<typeof form>>({ form: instance });
  });

  it('rejects an option beside an existing instance (G12)', () => {
    // @ts-expect-error The instance keeps the options of its owner.
    accepts<RootProps<typeof form>>({
      form: instance,
      options: { defaultValues: { name: 'Ada', color: '', address: { city: '' } } },
    });
  });

  it('rejects an option outside options', () => {
    // @ts-expect-error `defaultValues` is an option, so it goes in `options`.
    accepts<RootProps<typeof form>>({ defaultValues: { name: 'Ada', color: '', address: { city: '' } } });
  });
});

describe('RootComponent', () => {
  it('takes the DOM props of the element of the root slot', () => {
    accepts(<parts.Root action='/sign-in' />);
  });

  it('gives a DOM prop with the name of an option to the element', () => {
    accepts(
      <parts.Root
        onSubmit={event => expectTypeOf(event.currentTarget).toEqualTypeOf<EventTarget & HTMLFormElement>()}
      />,
    );
  });

  it('takes no DOM prop for a form with no root slot', () => {
    const { Root } = createParts(bare);
    // @ts-expect-error The form has no root slot, so Root renders no element.
    accepts(<Root action='/sign-in' />);
  });
});

describe('FormHooks', () => {
  it('gives the field handles of the form and of a scope', () => {
    expectTypeOf(parts.useField('name')).toExtend<FieldHandle<Profile, 'name', 'error'>>();
    expectTypeOf(parts.useForm()).toEqualTypeOf<InstanceOf<typeof form>>();
  });

  it('rejects a path that the form does not have', () => {
    // @ts-expect-error `nope` is not a path of Profile.
    parts.useField('nope');
  });
});
