import { Field, Subscribe, createForm } from 'oxform-solid/v2';
import type { JSX } from '@solidjs/web';
import z from 'zod';

const schema = z.object({ name: z.string() });

export const HydrationForm = (): JSX.Element => {
  const form = createForm({ schema, id: 'hydration-form', defaultValues: { name: 'Ada' } });
  return (
    <form onSubmit={event => event.preventDefault()}>
      <Field form={form} name='name'>
        {field => (
          <label>
            Name
            <input id='hydrated-name' {...field.props} />
          </label>
        )}
      </Field>
      <Subscribe api={form} selector={state => state.values.name}>
        {name => <output>{name()}</output>}
      </Subscribe>
      <button type='button' onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
};
