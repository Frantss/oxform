import { FormApi } from '#/form-api';
import { useField } from '#/react';
import 'react';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { z } from 'zod';

const setup = () => {
  const form = new FormApi({
    schema: z.object({
      name: z.string(),
      last: z.string().optional(),
    }),
    defaultValues: {
      name: 'John',
      last: 'Doe',
    },
  });

  return { form };
};

it("should update the form's values on change", async () => {
  const { form } = setup();

  const Component = () => {
    const field = useField({ form, name: 'name' });

    return <input {...field.props} />;
  };

  const utils = await render(<Component />);

  const input = utils.getByRole('textbox');

  await userEvent.clear(input);
  await userEvent.type(input, 'Jane');

  expect(form.store.state.values.name).toBe('Jane');
  expect(form.store.state.values.last).toBe('Doe');
});
