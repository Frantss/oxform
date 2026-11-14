import { Profiler, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';
import { configureForm } from '../form';
import { standardForm } from '../standard';
import { defaultProfile, failing, schemaOf, type Profile } from '../test-helpers';
import { createParts } from './create-parts';

const profile = (options: Record<string, unknown> = {}) =>
  configureForm(standardForm, { schema: schemaOf<Profile>(), defaultValues: defaultProfile, ...options } as never);

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
  const form = configured();
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
  const form = configured();
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
  const form = configured();
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
  const form = configured();
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
  const form = configured();
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
