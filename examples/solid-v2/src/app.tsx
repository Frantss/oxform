import {
  ArrayField,
  Field,
  Subscribe,
  createField,
  createForm,
  createFormEffect,
  createSubscribe,
} from 'oxform-solid/v2';
import { For, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Enter at least three characters'),
  email: z.string().email('Enter a valid email'),
  updates: z.boolean(),
  members: z.object({ name: z.string().min(3, 'Enter at least three characters') }).array(),
});

export const App = (): JSX.Element => {
  const form = createForm({
    schema,
    defaultValues: { name: '', email: '', updates: false, members: [{ name: '' }] },
    checks: {
      error: { validate: { change: schema } },
      warning: {
        validate: {
          change: z.object({
            email: z
              .string()
              .refine(email => !email || email.endsWith('@company.com'), 'A company email is recommended'),
          }),
        },
      },
    },
  });
  const updates = createField({ form, name: 'updates' });
  const values = createSubscribe(form, state => state.values);
  const [result, setResult] = createSignal('');
  const [lastEmail, setLastEmail] = createSignal('');
  createFormEffect(
    form,
    state => state.values.email,
    email => {
      setLastEmail(email);
    },
  );

  return (
    <main>
      <h1>Oxform + Solid 2</h1>
      <p>A local form demo with validation, keyed array fields, subscriptions, and explicit checkbox handling.</p>
      <form
        onSubmit={event => {
          event.preventDefault();
          void form.submit(
            value => {
              setResult(
                `Saved ${value.name} with ${value.members.length} ${value.members.length === 1 ? 'member' : 'members'}`,
              );
            },
            () => {
              setResult('Resolve the errors before saving');
            },
          )();
        }}
      >
        <Field form={form} name='name'>
          {field => (
            <div class='field'>
              <label for='name'>Full name</label>
              <input
                id='name'
                {...field.props}
                aria-invalid={field.state.status.valid ? 'false' : 'true'}
                aria-describedby='name-issues'
              />
              <span id='name-issues'>{field.state.issues.error.map(entry => entry.issue.message).join(', ')}</span>
            </div>
          )}
        </Field>
        <Field form={form} name='email'>
          {field => (
            <div class='field'>
              <label for='email'>Email</label>
              <input
                id='email'
                type='email'
                {...field.props}
                aria-invalid={field.state.status.valid ? 'false' : 'true'}
                aria-describedby='email-issues'
              />
              <span id='email-issues'>
                {[...field.state.issues.error, ...field.state.issues.warning]
                  .map(entry => entry.issue.message)
                  .join(', ')}
              </span>
            </div>
          )}
        </Field>
        <label class='checkbox'>
          <input
            type='checkbox'
            checked={updates.value}
            ref={updates.register}
            onChange={event => updates.change(event.currentTarget.checked)}
            onBlur={() => updates.blur()}
            onFocus={() => updates.focus()}
          />
          Receive updates
        </label>
        <ArrayField form={form} name='members'>
          {array => (
            <fieldset>
              <legend>Members</legend>
              <For each={array.ids} fallback={<p>No members. Add one below.</p>}>
                {(id, index) => (
                  <div class='member'>
                    <Field form={form} name={`members.${index()}.name`}>
                      {field => (
                        <div class='field'>
                          <label for={`member-${id}`}>Member {index() + 1}</label>
                          <input
                            id={`member-${id}`}
                            {...field.props}
                            aria-invalid={field.state.status.valid ? 'false' : 'true'}
                            aria-describedby={`member-${id}-issues`}
                          />
                          <span id={`member-${id}-issues`}>
                            {field.state.issues.error.map(entry => entry.issue.message).join(', ')}
                          </span>
                        </div>
                      )}
                    </Field>
                    <div class='actions'>
                      <button
                        type='button'
                        disabled={index() === 0}
                        aria-label={`Move member ${index() + 1} up`}
                        onClick={() => array.move(index(), index() - 1)}
                      >
                        Move up
                      </button>
                      <button
                        type='button'
                        aria-label={`Remove member ${index() + 1}`}
                        onClick={() => array.remove(index())}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </For>
              <button type='button' onClick={() => array.append({ name: '' })}>
                Add member
              </button>
            </fieldset>
          )}
        </ArrayField>
        <div class='actions'>
          <button type='submit' disabled={form.status.submitting || form.status.validating}>
            Save account
          </button>
          <button
            type='button'
            onClick={() => {
              form.reset();
              setResult('');
              setLastEmail('');
            }}
          >
            Reset
          </button>
        </div>
        <p role='status' aria-label='Submission result'>
          {result()}
        </p>
        <Subscribe api={form} selector={state => state.status.submits}>
          {submits => (
            <p>
              Submits: <output aria-label='Submit count'>{submits()}</output>
            </p>
          )}
        </Subscribe>
      </form>
      <details open>
        <summary>Observed state</summary>
        <p>
          Form: <output aria-label='Form validity'>{form.status.valid ? 'Valid' : 'Invalid'}</output>
        </p>
        <p>
          Email effect: <output aria-label='Last email'>{lastEmail() || 'No changes yet'}</output>
        </p>
        <pre aria-label='Current values'>{JSON.stringify(values(), null, 2)}</pre>
      </details>
    </main>
  );
};
