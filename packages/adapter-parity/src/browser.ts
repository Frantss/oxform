import { expect, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { profile } from './fixtures';
import type { Scenario } from './scenario';

let mounts = 0;

/**
 * The locator of a mounted container. It finds the container by a test id, because `page.elementLocator` finds it
 * by its text, which changes as the form changes.
 */
const screenOf = (container: HTMLElement) => {
  container.dataset.testid ??= `parity-mount-${++mounts}`;
  return page.getByTestId(container.dataset.testid);
};

/** The parity scenarios that run in a browser, by id (`03-testing.md#Adapter tests: the parity suite`). */
export const browserScenarios = {
  P1: {
    title: 'parts render in the declared element, typing writes to the form, and option props reach the instance',
    run: async driver => {
      await using view = await driver.mount('signIn', {
        root: { options: { defaultValues: { email: 'ada@example.com', password: '' } } },
      });
      const screen = screenOf(view.container);
      const email = screen.getByLabelText('Email');

      await expect.element(email).toHaveValue('ada@example.com');
      await userEvent.fill(email, 'grace@example.com');

      expect([
        view.container.querySelector('[data-testid="root"]')?.tagName,
        email.element().tagName,
        screen.getByRole('button', { name: 'Sign in' }).element().tagName,
        view.instance.values.get('email'),
      ]).toEqual(['FORM', 'INPUT', 'BUTTON', 'grace@example.com']);
    },
  },
  'P1 bare': {
    title: 'Root of a form with no root slot renders no element, and its parts work',
    run: async driver => {
      await using view = await driver.mount('bare');
      const name = screenOf(view.container).getByLabelText('Name');
      await userEvent.fill(name, 'Ada');

      await expect.element(name).toHaveValue('Ada');
      expect([...view.container.children].map(element => element.tagName)).toEqual(['LABEL']);
    },
  },
  P2: {
    title:
      'a submit through the root shows the issues in the error parts, then calls onSubmit with the values and the pressed button',
    run: async driver => {
      const onSubmit = vi.fn();
      await using view = await driver.mount('signIn', { root: { options: { onSubmit } } });
      const screen = screenOf(view.container);
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await expect.element(screen.getByText('email is required')).toBeVisible();
      await expect.element(screen.getByText('password is required')).toBeVisible();
      expect(onSubmit).not.toHaveBeenCalled();

      await userEvent.fill(screen.getByLabelText('Email'), 'ada@example.com');
      await userEvent.fill(screen.getByLabelText('Password'), 'secret');
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
      expect([
        onSubmit.mock.calls[0]?.[0],
        onSubmit.mock.calls[0]?.[2],
        screen.getByRole('alert').elements().length,
      ]).toEqual([{ email: 'ada@example.com', password: 'secret' }, 'sign-in', 0]);
    },
  },
  P3: {
    title: 'the adapter hooks read state, and a part or a hook renders again only when what it reads changes',
    run: async driver => {
      await using view = await driver.mount('readers');
      const screen = screenOf(view.container);
      const before = ['email part', 'email field'].map(probe => view.renders(probe));
      await userEvent.fill(screen.getByLabelText('Name'), 'Ada');

      await expect.element(screen.getByLabelText('selected')).toHaveTextContent('Ada');
      expect(['email part', 'email field'].map(probe => view.renders(probe))).toEqual(before);

      await userEvent.fill(screen.getByLabelText('Email'), 'ada@example.com');
      await expect.element(screen.getByLabelText('email field')).toHaveTextContent('ada@example.com');
    },
  },
  P4: {
    title: 'author props and handlers merge with those of the slot, and the element registers and unregisters',
    run: async driver => {
      const ref = vi.fn();
      const onInput = vi.fn();
      await using view = await driver.mount('profileName', { ref, onInput });
      const name = screenOf(view.container).getByLabelText('Name');
      await userEvent.fill(name, 'Ada');
      const element = name.element() as HTMLInputElement;

      expect([
        element.className,
        element.dataset.author,
        element.id,
        onInput.mock.calls.length > 0,
        view.instance.values.get('name'),
        ref.mock.calls[0]?.[0],
        view.instance.field('name').state.ref,
      ]).toEqual(['author', 'yes', view.instance.field('name').state.id, true, 'Ada', element, element]);

      await view.rerender({ ref, onInput, show: false });
      expect(view.instance.field('name').state.ref).toBeNull();
    },
  },
  P5: {
    title: 'a part renders as another element through render, and in another element through usePart',
    run: async driver => {
      await using view = await driver.mount('otherElements');
      const screen = screenOf(view.container);
      await userEvent.fill(screen.getByLabelText('Name'), 'Ada');
      await userEvent.selectOptions(screen.getByLabelText('Color'), 'blue');

      expect([
        screen.getByLabelText('Name').element().tagName,
        screen.getByLabelText('Color').element().tagName,
        view.instance.values.get('name'),
        view.instance.values.get('color'),
      ]).toEqual(['TEXTAREA', 'SELECT', 'Ada', 'blue']);
    },
  },
  P6: {
    title: 'the scope prop, nested scopes, a placed scope, and the adapter hooks with a scope',
    run: async driver => {
      await using view = await driver.mount('scopes');
      const screen = screenOf(view.container);
      await userEvent.fill(screen.getByLabelText('Street', { exact: true }), 'Main');
      await userEvent.fill(screen.getByLabelText('Latitude'), '5');

      await expect.element(screen.getByLabelText('Street again')).toHaveValue('Main');
      await expect.element(screen.getByLabelText('street', { exact: true })).toHaveTextContent('Main');
      await expect.element(screen.getByLabelText('items')).toHaveTextContent('2');
      expect(view.instance.values.get('address')).toEqual({ street: 'Main', geo: { lat: 5 } });
    },
  },
  P7: {
    title: 'a swap of array items keeps each input element and its focus',
    run: async driver => {
      await using view = await driver.mount('list');
      const screen = screenOf(view.container);
      const first = screen.getByLabelText('Item 0').element();
      await userEvent.click(first);
      view.instance.arrays.swap('items', 0, 1);

      await expect.element(screen.getByLabelText('Item 1')).toHaveValue('a');
      expect([screen.getByLabelText('Item 1').element(), document.activeElement]).toEqual([first, first]);
    },
  },
  P8: {
    title:
      'checkbox, radio, select, multiple select, number and file inputs write their values, and a reset empties the file input',
    run: async driver => {
      await using view = await driver.mount('inputs');
      const screen = screenOf(view.container);
      const avatar = new File(['a'], 'avatar.png', { type: 'image/png' });
      await userEvent.click(screen.getByLabelText('Agree'));
      await userEvent.click(screen.getByLabelText('Pro'));
      await userEvent.selectOptions(screen.getByLabelText('Color'), 'blue');
      await userEvent.selectOptions(screen.getByLabelText('Tags'), ['a', 'b']);
      await userEvent.fill(screen.getByLabelText('Age'), '42');
      await userEvent.upload(screen.getByLabelText('Avatar'), avatar);
      const { agree, plan, color, tags, age } = view.instance.values.get();

      expect([agree, plan, color, tags, age, (view.instance.values.get('avatar') as File | null)?.name]).toEqual([
        true,
        'pro',
        'blue',
        ['a', 'b'],
        42,
        'avatar.png',
      ]);
      await expect.element(screen.getByLabelText('Pro')).toBeChecked();
      await expect.element(screen.getByLabelText('Free')).not.toBeChecked();

      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
      await expect.element(screen.getByLabelText('Agree')).not.toBeChecked();
      expect([
        (screen.getByLabelText('Avatar').element() as HTMLInputElement).value,
        view.instance.values.get('avatar'),
      ]).toEqual(['', null]);
    },
  },
  P9: {
    title: 'ids are stable and unique for two forms on one page, and link the control to its error',
    run: async driver => {
      await using view = await driver.mount('twoSignIns');
      const screen = screenOf(view.container);
      const [first, second] = ['first', 'second'].map(name => screen.getByRole('region', { name }));
      const [firstEmail, secondEmail] = [first!, second!].map(section => section.getByLabelText('Email').element());
      const ids = [firstEmail!.id, secondEmail!.id];
      await userEvent.click(first!.getByRole('button', { name: 'Sign in' }));
      await expect.element(first!.getByText('email is required')).toBeVisible();
      await view.rerender({});

      expect([
        ids[0] !== '' && ids[0] !== ids[1],
        [firstEmail!.id, secondEmail!.id],
        document.getElementById(firstEmail!.getAttribute('aria-describedby') ?? '')?.textContent,
        first!.element().contains(document.getElementById(firstEmail!.getAttribute('aria-describedby') ?? '')),
        secondEmail!.hasAttribute('aria-describedby'),
      ]).toEqual([true, ids, 'email is required', true, false]);
    },
  },
  P11: {
    title: 'hydration of the server HTML logs no warning or error and keeps the controls',
    run: async driver => {
      const { html } = await driver.renderToString('signIn');
      const container = document.body.appendChild(document.createElement('div'));
      container.innerHTML = html;
      const email = container.querySelector('input[name="email"]');
      const error = vi.spyOn(console, 'error');
      const warn = vi.spyOn(console, 'warn');
      try {
        await using view = await driver.hydrate(container, 'signIn');
        await userEvent.fill(screenOf(container).getByLabelText('Email'), 'ada@example.com');

        expect([container.querySelector('input[name="email"]') === email, view.instance.values.get('email')]).toEqual([
          true,
          'ada@example.com',
        ]);
        expect([error.mock.calls, warn.mock.calls]).toEqual([[], []]);
      } finally {
        error.mockRestore();
        warn.mockRestore();
      }
    },
  },
  P14: {
    title:
      'Root takes an existing instance, unmount stops the work and keeps the instance usable, and a double mount works',
    run: async driver => {
      const instance = profile.create({ id: 'existing' });
      instance.field('name').change('Grace');
      await using given = await driver.mount('profileName', { root: { form: instance } });
      await userEvent.fill(screenOf(given.container).getByLabelText('Name'), 'Grace!');

      expect([given.instance, instance.values.get('name')]).toEqual([instance, 'Grace!']);

      await using strict = await driver.mount('profileName', {}, { strict: true });
      await userEvent.fill(screenOf(strict.container).getByLabelText('Name'), 'Ada');
      const before = strict.instance.probe.cleanups;
      await strict.unmount();
      strict.instance.values.set('name', 'after');

      expect([
        strict.instance.probe.cleanups,
        strict.instance.field('name').state.ref,
        strict.instance.values.get('name'),
      ]).toEqual([before + 1, null, 'after']);
    },
  },
} satisfies Record<string, Scenario>;
