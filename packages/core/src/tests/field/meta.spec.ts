import { FormApi } from '#form-api';
import { describe, expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  nested: z.object({
    deep: z.object({
      value: z.string(),
      array: z.string().array(),
    }),
  }),
});

const defaultValues = {
  name: 'Default Name',
  nested: {
    deep: {
      value: 'default value',
      array: ['default1', 'default2'],
    },
  },
};

const setup = async () => {
  const form = new FormApi({
    schema,
    defaultValues,
  });

  form['~mount']();

  return { form };
};

describe.each([
  { field: 'name' as const, label: 'flat field' },
  { field: 'nested.deep.value' as const, label: 'nested field' },
])('$label', ({ field }) => {
  it('should return default meta', async () => {
    const { form } = await setup();
    const meta = form.field.meta(field);

    expect(meta).toStrictEqual({
      blurred: false,
      touched: false,
      dirty: false,
      default: true,
      valid: true,
      pristine: true,
    });
  });

  it('should return correct meta after change', async () => {
    const { form } = await setup();

    form.field.change(field, 'Changed Value');
    const meta = form.field.meta(field);

    expect(meta).toStrictEqual({
      blurred: false,
      touched: true,
      dirty: true,
      default: false,
      valid: true,
      pristine: false,
    });
  });

  it('should return correct meta after blur', async () => {
    const { form } = await setup();

    form.field.blur(field);
    const meta = form.field.meta(field);

    expect(meta).toStrictEqual({
      blurred: true,
      touched: false,
      dirty: false,
      default: true,
      valid: true,
      pristine: true,
    });
  });
});

it('should merge sub-field meta correctly', async () => {
  const { form } = await setup();

  form.field.change('nested.deep.value', 'Changed Value');

  const meta = form.field.meta('nested');

  expect(meta).toStrictEqual({
    blurred: false,
    touched: true,
    dirty: true,
    default: false,
    valid: true,
    pristine: false,
  });
});
