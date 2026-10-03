import { mount } from '#tests/setup';
import { ArrayField, Field, Subscribe, createArrayField, createForm } from 'oxform-solid/v2';
import { For, flush } from 'solid-js';
import { page, userEvent } from 'vite-plus/test/browser';
import { expect, it } from 'vite-plus/test';
import z from 'zod';

it('should bind input events, focus, blur, validation feedback and reset', async () => {
  let form!: ReturnType<typeof setupForm>;
  const schema = z.object({ email: z.string().email('Enter a valid email') });
  const setupForm = () => createForm({ schema, defaultValues: { email: '' }, checks: { error: { validate: { change: schema } } } });
  mount(() => {
    form = setupForm();
    return (
      <>
        <Field form={form} name='email'>
          {field => (
            <>
              <label>
                Email
                <input {...field.props} />
              </label>
              <span>{field.state.issues.error.map(entry => entry.issue.message).join(', ')}</span>
            </>
          )}
        </Field>
        <Subscribe api={form} selector={state => state.status.valid}>
          {valid => <output aria-label='Validity'>{valid() ? 'Valid' : 'Invalid'}</output>}
        </Subscribe>
        <button onClick={() => form.reset()}>Reset</button>
      </>
    );
  });
  const input = page.getByRole('textbox', { name: 'Email' });
  await userEvent.type(input, 'invalid');
  expect(form.values.email).toBe('invalid');
  expect(form.field.status('email').touched).toBe(true);
  await expect.element(page.getByText('Enter a valid email', { exact: true })).toBeVisible();
  await expect.element(page.getByLabelText('Validity')).toHaveTextContent('Invalid');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect.element(input).toHaveValue('');
  await expect.element(page.getByLabelText('Validity')).toHaveTextContent('Valid');
});

it('should retain DOM identity and refs while keyed rows move, swap, shift and disappear', async () => {
  const schema = z.object({ contacts: z.object({ email: z.string() }).array() });
  const setupForm = () => createForm({ schema, defaultValues: { contacts: [{ email: 'Ada' }, { email: 'Grace' }, { email: 'Lin' }] } });
  let form!: ReturnType<typeof setupForm>;
  let array!: ReturnType<typeof createArrayField<{ form: ReturnType<typeof setupForm>; name: 'contacts' }>>;
  const container = mount(() => {
    form = setupForm();
    return (
      <ArrayField form={form} name='contacts'>
        {contacts => {
          array = contacts;
          return (
            <For each={contacts.ids}>
              {(_id, index) => (
                <Field form={form} name={`contacts.${index()}.email`}>
                  {field => (
                    <label>
                      Contact {index() + 1}
                      <input {...field.props} data-id={field.id} aria-label={`Contact ${index() + 1}`} />
                    </label>
                  )}
                </Field>
              )}
            </For>
          );
        }}
      </ArrayField>
    );
  });
  const original = Array.from(container.querySelectorAll('input'));
  const ids = array.ids;
  array.move(2, 0);
  flush();
  expect(array.ids).toEqual([ids[2], ids[0], ids[1]]);
  expect(Array.from(container.querySelectorAll('input'))).toEqual([original[2], original[0], original[1]]);
  expect(container.isConnected).toBe(true);
  expect(Array.from(container.querySelectorAll('input')).map(input => input.getAttribute('aria-label'))).toEqual([
    'Contact 1',
    'Contact 2',
    'Contact 3',
  ]);
  await userEvent.fill(page.getByRole('textbox', { name: 'Contact 1', exact: true }), 'Alan');
  expect(form.values.contacts[0].email).toBe('Alan');
  expect(form.values.contacts[2].email).toBe('Grace');
  array.swap(0, 2);
  flush();
  expect(Array.from(container.querySelectorAll('input'))).toEqual([original[1], original[0], original[2]]);
  array.prepend({ email: 'New' });
  flush();
  expect(container.querySelectorAll('input')[1]).toBe(original[1]);
  array.remove(2);
  flush();
  expect(container.querySelectorAll('input')).toHaveLength(3);
  expect(original[0].isConnected).toBe(false);
  for (const [index, input] of Array.from(container.querySelectorAll('input')).entries()) {
    expect(form.store.state.fields[`~root.contacts.${index}.email`].ref).toBe(input);
  }
  array.remove(2);
  array.remove(1);
  array.remove(0);
  flush();
  expect(container.querySelectorAll('input')).toHaveLength(0);
  array.append({ email: 'Again' });
  await expect.element(page.getByRole('textbox', { name: 'Contact 1', exact: true })).toHaveValue('Again');
});
