import { ArrayField, Field, Subscribe, formOptions, useForm, type FormIssuesByLevel } from 'oxform-react';
import { useState } from 'react';
import z from 'zod';

const schema = z.object({
  profile: z.object({
    name: z.string().min(3, 'Enter at least three characters for your name'),
    email: z.email('Enter a valid email address'),
  }),
  members: z
    .object({ name: z.string().min(3, 'Enter at least three characters for the member name') })
    .array()
    .min(1),
});

const checkEmail = async (email: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  return !email.endsWith('@blocked.example');
};

const Feedback = ({ issues }: { issues: FormIssuesByLevel<'error' | 'warning' | 'risk'> }) => (
  <div className='field-issues' aria-live='polite'>
    {Object.values(issues)
      .flat()
      .map((entry, index) => (
        <p className='field-issue' data-level={entry.level} key={`${entry.level}-${index}`}>
          <strong>{entry.level}</strong> {entry.issue.message}
        </p>
      ))}
  </div>
);

export const Example_Checks = ({ verifyEmail = checkEmail }: { verifyEmail?: typeof checkEmail }) => {
  const [result, setResult] = useState('');
  const form = useForm(
    formOptions({
      schema,
      defaultValues: { profile: { name: '', email: '' }, members: [{ name: '' }] },
      checks: {
        error: { validate: { change: schema, blur: schema } },
        warning: {
          validate: {
            change: store =>
              z.object({
                profile: z.object({
                  email: z
                    .string()
                    .refine(
                      email => !email || email.endsWith('@company.com'),
                      `A company email is recommended for ${store.values.profile.name || 'this account'}`,
                    ),
                }),
              }),
          },
        },
        risk: {
          blocking: true,
          validate: {
            submit: z.object({
              profile: z.object({ email: z.string().refine(verifyEmail, 'This email domain is blocked') }),
            }),
          },
        },
      },
    }),
  );

  return (
    <form
      className='form'
      noValidate
      onSubmit={event => {
        event.preventDefault();
        setResult('');
        void form.submit(
          values =>
            setResult(
              `Saved ${values.profile.name} with ${values.members.length} ${values.members.length === 1 ? 'member' : 'members'}`,
            ),
          () => setResult('Resolve the errors or blocking issues before saving'),
        )();
      }}
    >
      <Field form={form} name='profile.name'>
        {field => (
          <div className='field'>
            <label className='field-label' htmlFor={field.id}>
              Full name
            </label>
            <input
              className='input'
              id={field.id}
              autoComplete='name'
              {...field.props}
              aria-invalid={!field.state.status.valid}
            />
            <Feedback issues={field.state.issues} />
          </div>
        )}
      </Field>
      <Field form={form} name='profile.email'>
        {field => (
          <div className='field'>
            <label className='field-label' htmlFor={field.id}>
              Email
            </label>
            <input
              className='input'
              id={field.id}
              type='email'
              autoComplete='email'
              {...field.props}
              aria-invalid={!field.state.status.valid}
            />
            <Feedback issues={field.state.issues} />
          </div>
        )}
      </Field>
      <ArrayField form={form} name='members'>
        {array => (
          <fieldset className='field'>
            <legend>Members</legend>
            {array.ids?.map((id, index) => (
              <div className='field' key={id}>
                <Field form={form} name={`members.${index}.name`}>
                  {field => (
                    <>
                      <label className='field-label' htmlFor={field.id}>
                        Member {index + 1}
                      </label>
                      <input
                        className='input'
                        id={field.id}
                        {...field.props}
                        aria-invalid={!field.state.status.valid}
                      />
                      <Feedback issues={field.state.issues} />
                    </>
                  )}
                </Field>
                <div className='form-actions'>
                  <button className='btn' type='button' onClick={() => array.remove(index)}>
                    Remove member {index + 1}
                  </button>
                  {index > 0 && (
                    <button className='btn' type='button' onClick={() => array.move(index, index - 1)}>
                      Move member {index + 1} up
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Feedback issues={array.state.issues} />
            <button className='btn' type='button' onClick={() => array.append({ name: '' })}>
              Add member
            </button>
          </fieldset>
        )}
      </ArrayField>
      <div className='form-actions'>
        <button
          className='btn'
          type='button'
          onClick={() =>
            form.field.setIssues('profile.email', {
              risk: [{ level: 'risk', issue: { message: 'Email needs manual review' } }],
            })
          }
        >
          Flag email for review
        </button>
        <button className='btn' type='button' onClick={() => form.field.setIssues('profile.email', { risk: [] })}>
          Clear review
        </button>
        <Subscribe api={form} selector={state => state.status}>
          {status => (
            <button className='btn btn-primary' type='submit' disabled={status.submitting || status.validating}>
              {status.submitting ? 'Checking email…' : 'Save account'}
            </button>
          )}
        </Subscribe>
        <button
          className='btn'
          type='button'
          onClick={() => {
            form.reset();
            setResult('');
          }}
        >
          Reset
        </button>
      </div>
      <output aria-live='polite' aria-label='Submission result'>
        {result}
      </output>
      <Subscribe api={form} selector={state => state}>
        {state => (
          <>
            <output aria-label='Form validity'>{state.status.valid ? 'Valid' : 'Invalid'}</output>
            <output aria-label='Submit count'>{state.status.submits}</output>
            <pre aria-label='Current values'>{JSON.stringify(state.values, null, 2)}</pre>
          </>
        )}
      </Subscribe>
    </form>
  );
};
