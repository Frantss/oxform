import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { createSignal, type JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it } from 'vite-plus/test';
import { createParts } from './create-parts';

type Values = { name: string; nickname: string; tags: string[]; address: { city: string }; billing: { city: string } };

const defaultValues: Values = { name: 'Ada', nickname: 'A', tags: ['a'], address: { city: 'Paris' }, billing: { city: 'Rome' } };
const form = defineForm({ schema: {} as StandardSchemaV1<Values>, defaultValues }).extend(standard);

/**
 * The parts of `form`, an instance, and `mount`, which renders a view inside a `Root` of that instance and returns
 * the text of the container. Disposing unmounts the view and removes its container.
 */
const setup = () => {
  const parts = createParts(form);
  const instance = form.create();
  const container = document.body.appendChild(document.createElement('div'));
  const disposers: (() => void)[] = [];
  const mount = (view: () => JSX.Element, root = true) => {
    disposers.push(render(() => (root ? <parts.Root form={instance}>{view()}</parts.Root> : view()), container));
    return () => container.textContent;
  };

  return {
    parts,
    instance,
    mount,
    [Symbol.dispose]: () => {
      disposers.forEach(dispose => dispose());
      container.remove();
    },
  };
};

const message = 'oxform: call this inside the Root of the same form object. `configure` returns a new form object.';

describe('useForm', () => {
  it('throws outside a Root', () => {
    using subject = setup();

    expect(() => subject.mount(() => subject.parts.useForm().id, false)).toThrow(message);
  });

  it('throws inside the Root of another form object', () => {
    using subject = setup();
    const Other = createParts(form.configure({})).Root;

    expect(() => subject.mount(() => <Other>{subject.parts.useForm().id}</Other>, false)).toThrow(message);
  });

  it('gives the instance of the Root', () => {
    using subject = setup();
    const Reader = () => subject.parts.useForm().values.get('name');

    expect(subject.mount(() => <Reader />)()).toBe('Ada');
  });
});

describe('useSelector', () => {
  it('returns an accessor that follows the selected state', () => {
    using subject = setup();
    const Reader = () => {
      const name = subject.parts.useSelector(state => state.values.name);
      return <>{name()}</>;
    };
    const text = subject.mount(() => <Reader />);
    subject.instance.values.set('name', 'Grace');

    expect(text()).toBe('Grace');
  });

  it('keeps the previous result while compare calls the results equal', () => {
    using subject = setup();
    const Reader = () => {
      const tags = subject.parts.useSelector(state => [...state.values.tags], { compare: (a, b) => a.length === b.length });
      return <>{tags().join()}</>;
    };
    const text = subject.mount(() => <Reader />);
    subject.instance.values.set('tags', ['b']);
    const same = text();
    subject.instance.values.set('tags', ['b', 'c']);

    expect([same, text()]).toEqual(['a', 'b,c']);
  });
});

describe('useField', () => {
  it('gives a handle whose get() follows the value in a reactive scope', () => {
    using subject = setup();
    const Reader = () => {
      const name = subject.parts.useField('name');
      return <>{name.get()}</>;
    };
    const text = subject.mount(() => <Reader />);
    subject.instance.values.set('name', 'Grace');

    expect(text()).toBe('Grace');
  });

  it('follows the path of an accessor', () => {
    using subject = setup();
    const [path, setPath] = createSignal<'name' | 'nickname'>('name');
    const Reader = () => {
      const field = subject.parts.useField(path);
      return <>{field.get()}</>;
    };
    const text = subject.mount(() => <Reader />);
    setPath('nickname');

    expect(text()).toBe('A');
  });
});

describe('useArray', () => {
  it('gives a handle whose ids follow the array in a reactive scope', () => {
    using subject = setup();
    const Reader = () => {
      const tags = subject.parts.useArray('tags');
      return <>{tags.ids.length}</>;
    };
    const text = subject.mount(() => <Reader />);
    subject.instance.arrays.append('tags', 'b');

    expect(text()).toBe('2');
  });
});

describe('useScope', () => {
  it('follows the prefix of an accessor', () => {
    using subject = setup();
    const [prefix, setPrefix] = createSignal<'address' | 'billing'>('address');
    const Reader = () => {
      const scope = subject.parts.useScope(prefix);
      const city = subject.parts.useField('city', { scope });
      return <>{city.get()}</>;
    };
    const text = subject.mount(() => <Reader />);
    setPrefix('billing');

    expect(text()).toBe('Rome');
  });
});
