import { Field, Subscribe, useFieldApi, useForm, useFormEffect } from 'oxform-react';
import { useEffect, useState } from 'react';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3),
  directions: z.string().array().optional(),
});

export const Example_Effect = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const form = useForm({
    schema,
    defaultValues: { name: '3213', directions: undefined },
    validate: { change: schema },
  });

  const name = useFieldApi({ form, name: 'name' });

  useEffect(() => {
    (window as any)['_form'] = form;
  }, [form]);

  useFormEffect(
    form,
    state => state.status.submits,
    submits => {
      setLogs(current => [...current, `[form] submits -> ${String(submits)}`]);
      console.info({ submits });
    },
  );

  useFormEffect(
    name,
    state => state.value,
    fieldName => {
      setLogs(current => [...current, `[field:name] value -> ${String(fieldName)}`]);
      console.info({ name: fieldName });
    },
  );

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(() => {
          console.log('submit');
        })();
      }}
    >
      <Field form={form} name='name'>
        {field => (
          <div>
            <input type='text' {...field.props} />
            {!field.state.meta.valid && field.state.errors.map(error => error.message).join(', ')}
          </div>
        )}
      </Field>

      <button type='submit'>Submit</button>

      <Subscribe api={form} selector={state => state.status.submits}>
        {submits => <div>Submits: {submits}</div>}
      </Subscribe>

      <div>
        <h3>Effect Logs</h3>
        <ol>
          {logs.map((log, index) => (
            <li key={`${index}-${log}`}>{log}</li>
          ))}
        </ol>
      </div>
    </form>
  );
};
