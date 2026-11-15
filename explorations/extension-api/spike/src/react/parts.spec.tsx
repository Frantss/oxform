import { Profiler, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';
import type { Scope } from '../api';
import { defineForm } from '../form';
import { defineScope } from '../scopes';
import { standard } from '../standard';
import { defaultProfile, failing, schemaOf, type Profile } from '../test-helpers';
import { createParts, usePart } from './create-parts';

// Options given to `configure` are defaults of every instance, and `Root` props override them. The helper takes a
// loose record, so the options are cast once here.
const profile = (options: Record<string, unknown> = {}) =>
  defineForm<Profile>({ schema: schemaOf<Profile>(), defaultValues: defaultProfile })
    .extend(standard)
    .configure(options as never);

const elements = { root: 'form', field: 'input', fieldError: 'p', submit: 'button', reset: 'button' } as const;

it('renders the preset parts and writes typing into the form', async () => {
  const { Root, Field, Submit } = createParts(profile(), elements);
  const screen = await render(
    <Root>
      <Field name='name' aria-label='name' />
      <Submit>Send</Submit>
    </Root>,
  );

  await userEvent.type(screen.getByLabelText('name'), 'Ada');
  await expect.element(screen.getByLabelText('name')).toHaveValue('Ada');
  await expect.element(screen.getByLabelText('name')).toHaveAttribute('data-dirty');
});

it('submits through the root and shows the check issues in the part', async () => {
  const submitted: unknown[] = [];
  const { Root, Field, FieldError, Submit } = createParts(
    profile({ error: { submit: failing({ message: 'Required', path: ['name'] }) }, onSubmit: (v: unknown) => submitted.push(v) }),
    elements,
  );
  const screen = await render(
    <Root>
      <Field name='name' aria-label='name' />
      <FieldError name='name'>{({ messages }) => messages.join()}</FieldError>
      <Submit>Send</Submit>
    </Root>,
  );

  await expect.element(screen.getByRole('alert')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));

  await expect.element(screen.getByRole('alert')).toHaveTextContent('Required');
  await expect.element(screen.getByLabelText('name')).toHaveAttribute('aria-invalid', 'true');
  expect(submitted).toEqual([]);
});

it('calls onSubmit with the values when the form is valid', async () => {
  const submitted: Profile[] = [];
  const { Root, Field, Submit } = createParts(profile({ onSubmit: (values: Profile) => void submitted.push(values) }), elements);
  const screen = await render(
    <Root>
      <Field name='name' aria-label='name' />
      <Submit>Send</Submit>
    </Root>,
  );

  await userEvent.type(screen.getByLabelText('name'), 'Ada');
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));

  await expect.poll(() => submitted.length).toBe(1);
  expect(submitted[0]!.name).toBe('Ada');
});

it('reads state through the hooks and re-renders on it', async () => {
  const { Root, Field, useField, useSelector } = createParts(profile(), elements);
  const Echo = () => {
    const name = useField('name');
    const length = useSelector(state => String(state.values.name).length);
    return <output>{`${name.state.value}:${length}:${name.state.status.dirty}`}</output>;
  };
  const screen = await render(
    <Root>
      <Field name='name' aria-label='name' />
      <Echo />
    </Root>,
  );

  await expect.element(screen.getByRole('status')).toHaveTextContent(':0:false');
  await userEvent.type(screen.getByLabelText('name'), 'Ada');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Ada:3:true');
});

it('uses an existing instance, and keeps working under strict mode', async () => {
  const configured = profile();
  const form = configured.create();
  form.field('name').change('Grace');
  const { Root, Field } = createParts(configured, elements);
  const screen = await render(
    <StrictMode>
      <Root form={form as never}>
        <Field name='name' aria-label='name' />
      </Root>
    </StrictMode>,
  );

  await expect.element(screen.getByLabelText('name')).toHaveValue('Grace');
  await userEvent.type(screen.getByLabelText('name'), '!');
  expect(form.field('name').get()).toBe('Grace!');
});

it('creates a strict-mode instance that is still alive after the setup runs twice', async () => {
  const { Root, Field } = createParts(profile(), elements);
  const screen = await render(
    <StrictMode>
      <Root>
        <Field name='name' aria-label='name' />
      </Root>
    </StrictMode>,
  );

  await userEvent.type(screen.getByLabelText('name'), 'Ada');
  await expect.element(screen.getByLabelText('name')).toHaveValue('Ada');
});

it('renders on the server with the state at creation and starts nothing', () => {
  const configured = profile({ error: { submit: failing({ message: 'Required', path: ['name'] }) } });
  const form = configured.create();
  form.field('name').change('Ada');
  const { Root, Field, FieldError } = createParts(configured, elements);

  const html = renderToString(
    <Root form={form as never}>
      <Field name='name' />
      <FieldError name='name'>never</FieldError>
    </Root>,
  );

  expect(html).toContain('value="Ada"');
  expect(html).not.toContain('role="alert"');
});

it('keeps the form wiring when the author passes the same props, and merges the author ref', async () => {
  const configured = profile();
  const form = configured.create();
  form.field('name').change('Ada');
  const { Root, Field } = createParts(configured, elements);
  let authorElement: HTMLElement | null = null;
  const screen = await render(
    <Root form={form as never}>
      <Field name='name' aria-label='name' value='author' ref={element => void (authorElement = element)} />
    </Root>,
  );

  await expect.element(screen.getByLabelText('name')).toHaveValue('Ada');
  expect(authorElement).toBe(screen.getByLabelText('name').element());
  expect(form.field('name').state.ref).toBe(authorElement);
});

it('registers the element with the form and lets go of it when the part unmounts', async () => {
  const configured = profile();
  const form = configured.create();
  const { Root, Field } = createParts(configured, elements);
  const screen = await render(
    <Root form={form as never}>
      <Field name='name' aria-label='name' />
    </Root>,
  );
  expect(form.field('name').state.ref).not.toBeNull();

  await screen.rerender(<Root form={form as never} />);
  expect(form.field('name').state.ref).toBeNull();
});

it('runs the author handler too, and warns about nothing', async () => {
  const errors: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => void errors.push(args);
  try {
    const { Root, Field } = createParts(profile(), elements);
    const calls: string[] = [];
    const screen = await render(
      <Root>
        <Field name='name' aria-label='name' onChange={() => calls.push('author')} />
      </Root>,
    );
    await userEvent.type(screen.getByLabelText('name'), 'a');

    expect(calls).toEqual(['author']);
    await expect.element(screen.getByLabelText('name')).toHaveValue('a');
    expect(errors).toEqual([]);
  } finally {
    console.error = original;
  }
});

it('tells the React event when a slot prevented the native one', async () => {
  const { Root, Submit } = createParts(profile(), elements);
  let seen: boolean | null = null;
  const screen = await render(
    <div onSubmit={event => void (seen = event.isDefaultPrevented())}>
      <Root>
        <Submit>Send</Submit>
      </Root>
    </div>,
  );

  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
  await expect.poll(() => seen).toBe(true);
});

it('applies the options the props carry on each render', async () => {
  const calls: string[] = [];
  const { Root, Submit } = createParts(profile(), elements);
  const App = ({ label }: { label: string }) => (
    <Root onSubmit={() => void calls.push(label)}>
      <Submit>Send</Submit>
    </Root>
  );
  const screen = await render(<App label='first' />);

  await screen.rerender(<App label='second' />);
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));

  await expect.poll(() => calls).toEqual(['second']);
});

it('renders a part as another element through render, as an element or a function', async () => {
  const { Root, Submit, Field } = createParts(profile(), elements);
  const screen = await render(
    <Root>
      <Field name='name' aria-label='name' render={<textarea />} />
      <Submit render={(props, state) => <a {...props}>{`submits:${state.submits}`}</a>} />
    </Root>,
  );

  expect(screen.getByLabelText('name').element().tagName).toBe('TEXTAREA');
  await userEvent.type(screen.getByLabelText('name'), 'Ada');
  await expect.element(screen.getByLabelText('name')).toHaveValue('Ada');
  await expect.element(screen.getByText('submits:0')).toBeInTheDocument();
  expect(screen.getByText('submits:0').element().tagName).toBe('A');
});

it('re-renders a part only when what it shows changes', async () => {
  const configured = profile();
  const form = configured.create();
  const { Root, Field } = createParts(configured, elements);
  const commits: Record<string, number> = { name: 0, tag: 0 };
  const count = (id: string) => () => void (commits[id] = (commits[id] ?? 0) + 1);
  const screen = await render(
    <Root form={form as never}>
      <Profiler id='name' onRender={count('name')}>
        <Field name='name' aria-label='name' />
      </Profiler>
      <Profiler id='tag' onRender={count('tag')}>
        <Field name='tags.0' aria-label='tag' />
      </Profiler>
    </Root>,
  );
  const before = { ...commits };

  form.field('tags.0').change('z');

  await expect.element(screen.getByLabelText('tag')).toHaveValue('z');
  expect(commits.tag).toBeGreaterThan(before.tag!);
  expect(commits.name).toBe(before.name);
});

const orders = <Values,>(defaultValues: Values, options: Record<string, unknown> = {}) =>
  defineForm({ schema: schemaOf<Values>(), defaultValues })
    .extend(standard)
    .configure(options as never);

it('names a part relative to the scope it is given, and shows the issues of that field', async () => {
  const configured = orders(
    { billing: { street: '' }, shipping: { street: '' } },
    { error: { submit: failing({ message: 'Required', path: ['shipping', 'street'] }) } },
  );
  const { Root, Field, FieldError, Submit, useScope } = createParts(configured, elements) as any;
  const Block = ({ scope, label }: { scope: object; label: string }) => (
    <>
      <Field scope={scope} name='street' aria-label={label} />
      <FieldError scope={scope} name='street'>
        {({ messages }: { messages: string[] }) => `${label}:${messages[0]}`}
      </FieldError>
    </>
  );
  const Blocks = () => (
    <>
      <Block scope={useScope('billing')} label='billing' />
      <Block scope={useScope('shipping')} label='shipping' />
    </>
  );
  const App = () => (
    <Root>
      <Blocks />
      <Submit>Send</Submit>
    </Root>
  );
  const screen = await render(<App />);

  await userEvent.type(screen.getByLabelText('shipping'), 'Main');
  await userEvent.clear(screen.getByLabelText('shipping'));
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));

  await expect.element(screen.getByRole('alert')).toHaveTextContent('shipping:Required');
  await expect.element(screen.getByLabelText('billing')).not.toHaveAttribute('aria-invalid', 'true');
  await expect.element(screen.getByLabelText('shipping')).toHaveAttribute('aria-invalid', 'true');
  const described = screen.getByLabelText('shipping').element().getAttribute('aria-describedby');
  expect(described).toContain('shipping-street');
});

it('resolves nested scopes and full names side by side', async () => {
  const configured = orders({ a: { b: { c: '' } }, top: '' });
  const { Root, Field, useScope, useSelector } = createParts(configured, elements) as any;
  const Values = () => <output>{JSON.stringify(useSelector((state: any) => state.values))}</output>;
  const Deep = () => <Field scope={useScope('a').scope('b')} name='c' aria-label='deep' />;
  const App = () => (
    <Root>
      <Deep />
      <Field name='top' aria-label='top' />
      <Values />
    </Root>
  );
  const screen = await render(<App />);

  await userEvent.type(screen.getByLabelText('deep'), 'x');
  await userEvent.type(screen.getByLabelText('top'), 'y');

  await expect.element(screen.getByRole('status')).toHaveTextContent('{"a":{"b":{"c":"x"}},"top":"y"}');
});

it('keeps the input and its focus when array items swap, since only the scope prop changes', async () => {
  const configured = orders({ members: [{ name: 'a' }, { name: 'b' }] });
  const form = configured.create();
  const { Root, Field } = createParts(configured, elements) as any;
  const members = form.array('members');
  const App = () => (
    <Root form={form}>
      {members.ids.map((id: string, index: number) => (
        <Field key={id} scope={form.scope(`members.${index}`)} name='name' aria-label={id} />
      ))}
    </Root>
  );
  const screen = await render(<App />);
  const [first, second] = members.ids as string[];
  const input = screen.getByLabelText(first!).element() as HTMLInputElement;
  input.focus();

  members.swap(0, 1);
  await screen.rerender(<App />);

  expect(screen.getByLabelText(first!).element()).toBe(input);
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('a');
  expect((screen.getByLabelText(second!).element() as HTMLInputElement).value).toBe('b');
});

it('reads relative to a scope through the hooks, nested too, and re-renders on that field only', async () => {
  const configured = orders({
    billing: { street: '', tags: ['x'], geo: { label: 'g' } },
    shipping: { street: 'S', tags: [] },
  });
  const { Root, Field, useField, useArrayField, useScope } = createParts(configured, elements) as any;
  const Summary = ({ scope, id }: { scope: object; id: string }) => {
    const street = useField('street', { scope });
    const tags = useArrayField('tags', { scope });
    return <output aria-label={id}>{`${street.state.value}|${tags.get().length}`}</output>;
  };
  const Label = ({ scope }: { scope: object }) => {
    const geo = useScope('geo', { scope });
    return <output aria-label='label'>{useField('label', { scope: geo }).get()}</output>;
  };
  const Inner = () => {
    const billing = useScope('billing');
    const shipping = useScope('shipping');
    return (
      <>
        <Field scope={billing} name='street' aria-label='input' />
        <Summary scope={billing} id='billing' />
        <Summary scope={shipping} id='shipping' />
        <Label scope={billing} />
      </>
    );
  };
  const screen = await render(
    <Root>
      <Inner />
    </Root>,
  );

  await userEvent.type(screen.getByLabelText('input'), 'Ada');

  await expect.element(screen.getByLabelText('billing')).toHaveTextContent('Ada|1');
  await expect.element(screen.getByLabelText('shipping')).toHaveTextContent('S|0');
  await expect.element(screen.getByLabelText('label')).toHaveTextContent('g');
});

type Controls = { agree: boolean; age: number | undefined; plan: string; colors: string[]; size: string };

const controls = () => {
  const parts = createParts(
    defineForm<Controls>({
      schema: schemaOf<Controls>(),
      defaultValues: { agree: false, age: 30, plan: 'free', colors: [], size: 'm' },
    } as never).extend(standard),
    elements,
  );
  const Values = () => <output aria-label='values'>{JSON.stringify(parts.useSelector(state => state.values))}</output>;
  return { ...parts, Values };
};

const valuesOf = (screen: { getByLabelText(text: string): { element(): Element } }) =>
  JSON.parse(screen.getByLabelText('values').element().textContent ?? '{}') as Partial<Controls>;

describe('field inputs of every type', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  it('binds a checkbox to a boolean', async () => {
    const { Root, Field, Values } = controls();
    const screen = await render(
      <StrictMode>
        <Root>
          <Field name='agree' type='checkbox' aria-label='agree' />
          <Values />
        </Root>
      </StrictMode>,
    );

    await userEvent.click(screen.getByLabelText('agree'));

    await expect.element(screen.getByLabelText('agree')).toBeChecked();
    await expect.poll(() => valuesOf(screen)).toMatchObject({ agree: true });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('binds a radio group to the checked radio value', async () => {
    const { Root, Field, Values } = controls();
    const screen = await render(
      <Root>
        <Field name='plan' type='radio' value='free' aria-label='free' />
        <Field name='plan' type='radio' value='pro' aria-label='pro' />
        <Values />
      </Root>,
    );

    await expect.element(screen.getByLabelText('free')).toBeChecked();
    await userEvent.click(screen.getByLabelText('pro'));

    await expect.element(screen.getByLabelText('pro')).toBeChecked();
    await expect.element(screen.getByLabelText('free')).not.toBeChecked();
    await expect.poll(() => valuesOf(screen)).toMatchObject({ plan: 'pro' });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('binds a select to its option value', async () => {
    const { Root, Field, Values } = controls();
    const screen = await render(
      <Root>
        <Field
          name='size'
          aria-label='size'
          render={
            <select>
              <option value='s'>S</option>
              <option value='m'>M</option>
              <option value='l'>L</option>
            </select>
          }
        />
        <Values />
      </Root>,
    );

    await userEvent.selectOptions(screen.getByLabelText('size'), 'l');

    await expect.element(screen.getByLabelText('size')).toHaveValue('l');
    await expect.poll(() => valuesOf(screen)).toMatchObject({ size: 'l' });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('binds a multiple select to a list of option values', async () => {
    const { Root, Field, Values } = controls();
    const screen = await render(
      <Root>
        <Field
          name='colors'
          aria-label='colors'
          render={
            <select multiple>
              <option value='red'>Red</option>
              <option value='green'>Green</option>
              <option value='blue'>Blue</option>
            </select>
          }
        />
        <Values />
      </Root>,
    );

    await userEvent.selectOptions(screen.getByLabelText('colors'), ['red', 'blue']);

    await expect.poll(() => valuesOf(screen)).toMatchObject({ colors: ['red', 'blue'] });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('binds a number input to a number', async () => {
    const { Root, Field, Values } = controls();
    const screen = await render(
      <Root>
        <Field name='age' type='number' aria-label='age' />
        <Values />
      </Root>,
    );

    await userEvent.clear(screen.getByLabelText('age'));
    await userEvent.type(screen.getByLabelText('age'), '42');

    await expect.poll(() => valuesOf(screen)).toMatchObject({ age: 42 });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('writes the chosen file of a file input', async () => {
    const { Root, Field, useSelector } = controls();
    const Chosen = () => <output aria-label='chosen'>{useSelector(state => String(state.values.size))}</output>;
    const screen = await render(
      <Root>
        <Field name='size' type='file' aria-label='file' />
        <Chosen />
      </Root>,
    );

    await userEvent.upload(screen.getByLabelText('file'), new File(['x'], 'a.txt'));

    await expect.element(screen.getByLabelText('chosen')).toHaveTextContent('[object File]');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('empties a file input when the form resets', async () => {
    const { Root, Field, Reset } = controls();
    const screen = await render(
      <Root>
        <Field name='size' type='file' aria-label='file' />
        <Reset>Reset</Reset>
      </Root>,
    );
    const input = screen.getByLabelText('file').element() as HTMLInputElement;

    await userEvent.upload(screen.getByLabelText('file'), new File(['x'], 'a.txt'));
    expect(input.files).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await expect.poll(() => input.files?.length).toBe(0);
  });

  it('shows no controlled-input warning for a text field', async () => {
    const { Root, Field } = controls();
    await render(
      <StrictMode>
        <Root>
          <Field name='plan' aria-label='plan' />
        </Root>
      </StrictMode>,
    );

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('third-party controls', () => {
  it('binds a callback control through useField, with status and errors', async () => {
    const parts = createParts(profile({ error: { change: failing({ message: 'Too short', path: ['name'] }) } }));
    const Library = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => (
      <button type='button' onClick={() => onValueChange(`${value}!`)}>{`library:${value}`}</button>
    );
    const Bound = () => {
      const name = parts.useField('name');
      return <Library value={name.state.value} onValueChange={value => name.change(value)} />;
    };
    const screen = await render(
      <parts.Root>
        <Bound />
        <parts.FieldError name='name' />
      </parts.Root>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'library:' }));

    await expect.element(screen.getByRole('button', { name: 'library:!' })).toBeVisible();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('binds a component that forwards its props, through a render function', async () => {
    const parts = createParts(profile());
    const TextBox = (props: React.ComponentPropsWithRef<'input'>) => (
      <span>
        <input {...props} />
      </span>
    );
    const screen = await render(
      <parts.Root>
        <parts.Field name='name' aria-label='name' render={props => <TextBox {...props} />} />
      </parts.Root>,
    );

    await userEvent.type(screen.getByLabelText('name'), 'Ada');

    await expect.element(screen.getByLabelText('name')).toHaveValue('Ada');
    await expect.element(screen.getByLabelText('name')).toHaveAttribute('data-dirty');
  });
});

describe('defaults and bound parts', () => {
  const failingName = failing({ message: 'First', path: ['name'] }, { message: 'Second', path: ['name'] });

  it('renders each part in the element its slot declares, and lets the caller override one', async () => {
    const { Root, Field, FieldError, Submit } = createParts(profile({ error: { submit: failingName } }), {
      field: 'textarea',
    });
    const screen = await render(
      <Root aria-label='form'>
        <Field name='name' aria-label='name' />
        <FieldError name='name' aria-label='error' />
        <Submit>Send</Submit>
      </Root>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(screen.getByLabelText('form').element().tagName).toBe('FORM');
    expect(screen.getByLabelText('name').element().tagName).toBe('TEXTAREA');
    await expect.element(screen.getByLabelText('error')).toHaveProperty('tagName', 'P');
  });

  it('shows the first message of a field error when it is given no children', async () => {
    const { Root, FieldError, Submit } = createParts(profile({ error: { submit: failingName } }));
    const screen = await render(
      <Root>
        <FieldError name='name' />
        <Submit>Send</Submit>
      </Root>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await expect.element(screen.getByRole('alert')).toHaveTextContent('First');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('Second');
  });

  it('tells onSubmit which submit button was pressed', async () => {
    const intents: (string | undefined)[] = [];
    const { Root, Submit } = createParts(profile({ onSubmit: (_values: unknown, _form: unknown, intent?: string) => void intents.push(intent) }));
    const screen = await render(
      <Root>
        <Submit value='draft'>Save draft</Submit>
        <Submit>Publish</Submit>
      </Root>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await expect.poll(() => intents).toEqual(['draft']);
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await expect.poll(() => intents).toEqual(['draft', undefined]);
  });

  it('names fields relative to the scope the parts are bound to, with no scope prop', async () => {
    const parts = createParts(profile());
    const Address = () => {
      const { Field } = parts.within(parts.useScope('address'));
      return <Field name='city' aria-label='city' />;
    };
    const screen = await render(
      <parts.Root>
        <Address />
      </parts.Root>,
    );

    await userEvent.type(screen.getByLabelText('city'), 'Paris');

    await expect.element(screen.getByLabelText('city')).toHaveValue('Paris');
  });

  it('gives the same components for the same scope, so nothing remounts', async () => {
    const parts = createParts(profile());
    const seen: object[] = [];
    const Address = () => {
      seen.push(parts.within(parts.useScope('address')).Field);
      return null;
    };
    const screen = await render(
      <parts.Root>
        <Address />
      </parts.Root>,
    );
    await screen.rerender(
      <parts.Root>
        <Address />
      </parts.Root>,
    );

    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);
  });
});

it('renders a placed scope through the scope prop, with its own validators at its own path', async () => {
  const address = defineScope({
    schema: schemaOf<{ street: string }>(),
    defaultValues: { street: '' },
    checks: { error: { blur: failing({ message: 'Required', path: ['street'] }) } },
  });
  const configured = defineForm({
    schema: schemaOf<{ name: string }>(),
    defaultValues: { name: '' },
    scopes: { billing: address, shipping: address },
  }).extend(standard);
  const { Root, Field, FieldError, useForm } = createParts(configured, elements);
  const Block = ({ scope, label }: { scope: Scope<{ street: string }, 'error'>; label: string }) => (
    <>
      <Field scope={scope} name='street' aria-label={label} />
      <FieldError scope={scope} name='street'>
        {({ messages }) => `${label}:${messages[0]}`}
      </FieldError>
    </>
  );
  const Blocks = () => {
    const form = useForm();
    return (
      <>
        <Block scope={form.scope('billing')} label='billing' />
        <Block scope={form.scope('shipping')} label='shipping' />
      </>
    );
  };
  const screen = await render(
    <Root>
      <Blocks />
    </Root>,
  );

  await userEvent.click(screen.getByLabelText('shipping'));
  await userEvent.tab();

  await expect.element(screen.getByRole('alert')).toHaveTextContent('shipping:Required');
  await expect.element(screen.getByLabelText('billing')).not.toHaveAttribute('aria-invalid', 'true');
  await expect.element(screen.getByLabelText('shipping')).toHaveAttribute('aria-invalid', 'true');
});
