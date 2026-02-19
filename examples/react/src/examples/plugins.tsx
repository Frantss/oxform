import { Field, useForm } from 'oxform-react';
import z from 'zod';
import { FieldError } from '../components/field-error';
import { FormStatus } from '../components/form-status';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email(),
});

export const Example_Plugins = () => {
  const form = useForm({
    schema,
    defaultValues: {
      name: '',
      email: '',
    },
    validate: { change: schema },
    with: {
      '*': field => ({
        valueType: typeof field.value,
      }),
      name: [
        field => ({
          length: field.value.length,
        }),
        field => ({
          hint: field.value.length < 2 ? 'Too short' : 'Looks good',
        }),
      ],
      email: field => ({
        domain: field.value.includes('@') ? field.value.split('@')[1] : 'missing',
      }),
    },
  });

  return (
    <form
      className='form'
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        return form.submit(console.log, console.error)();
      }}
    >
      <Field form={form} name='name'>
        {field =>
          (() => {
            const extra = field.extra as {
              length: number;
              hint: string;
              valueType: string;
            };

            return (
              <div className='field'>
                <label className='field-label'>Name</label>
                <input className='input' type='text' placeholder='Enter text...' {...field.props} />
                <FieldError field={field} />
                <span className='field-hint'>
                  from extra: length={extra.length} | hint={extra.hint}
                </span>
                <div className='status'>
                  <div className='status-tag' data-on={true}>
                    <span className='status-dot' />
                    value type: {extra.valueType}
                  </div>
                </div>
              </div>
            );
          })()
        }
      </Field>

      <Field form={form} name='email'>
        {field =>
          (() => {
            const extra = field.extra as {
              domain: string;
              valueType: string;
            };

            return (
              <div className='field'>
                <label className='field-label'>Email</label>
                <input className='input' type='email' placeholder='Enter value...' {...field.props} />
                <FieldError field={field} />
                <span className='field-hint'>from extra: domain={extra.domain}</span>
                <span className='field-hint'>from extra: value type={extra.valueType}</span>
              </div>
            );
          })()
        }
      </Field>

      <div className='form-actions'>
        <button className='btn btn-primary' type='submit'>
          Submit
        </button>
        <button className='btn' type='button' onClick={() => form.reset()}>
          Reset
        </button>
      </div>

      <FormStatus form={form} />
    </form>
  );
};
