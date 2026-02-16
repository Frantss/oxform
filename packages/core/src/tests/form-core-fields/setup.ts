import { FormCore } from '#form/form-core';
import { FormCoreFields } from '#form/form-core-fields';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  array: z.number().array(),
  nested: z.object({
    value: z.string(),
  }),
});

const defaultValues = {
  name: 'name',
  array: [1, 2, 3, 4, 5, 6, 7],
  nested: {
    value: 'value',
  },
};

type Values = z.infer<typeof schema>;

export const setup = () => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
  });

  const fields = new FormCoreFields<Values>({ core });

  return {
    core,
    fields,
    [Symbol.dispose]: () => {},
  };
};
