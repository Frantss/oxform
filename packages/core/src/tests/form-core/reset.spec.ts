import { FormCore } from '#form/form-core';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import type { FormOptions } from '#types/api/form-options';
import { expect, it } from 'vitest';
import z from 'zod';

const schema = z.object({
  name: z.string(),
  nested: z.object({
    value: z.string(),
  }),
});

const defaultValues = {
  name: 'name',
  nested: {
    value: 'value',
  },
};

type Values = z.infer<typeof schema>;

const setup = (options?: {
  defaultStatus?: FormOptions<Values>['defaultStatus'];
  defaultFieldMeta?: FormOptions<Values>['defaultFieldMeta'];
}) => {
  const core = new FormCore<Values>({
    schema,
    defaultValues,
    defaultStatus: options?.defaultStatus,
    defaultFieldMeta: options?.defaultFieldMeta,
  });
  const unmount = core.store.mount();
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });

  return {
    core,
    field,
    [Symbol.dispose]: () => {
      unmount();
    },
  };
};

it('initializes and resets status with configured defaults', () => {
  using context = setup({
    defaultStatus: {
      dirty: true,
      submitting: true,
      submits: 4,
      successful: true,
    },
  });

  expect(context.core.store.state.status.dirty).toBe(true);
  expect(context.core.store.state.status.submitting).toBe(true);
  expect(context.core.store.state.status.submits).toBe(4);
  expect(context.core.store.state.status.successful).toBe(true);

  context.core.persisted.setState(state => {
    return {
      ...state,
      status: {
        ...state.status,
        dirty: false,
        submits: 1,
        submitting: false,
        successful: false,
      },
    };
  });

  context.core.reset();

  expect(context.core.store.state.status.dirty).toBe(true);
  expect(context.core.store.state.status.submitting).toBe(true);
  expect(context.core.store.state.status.submits).toBe(4);
  expect(context.core.store.state.status.successful).toBe(true);
});

it('resets field meta using wildcard and field-specific defaults', () => {
  using context = setup({
    defaultFieldMeta: {
      '*': { touched: true },
      name: { dirty: true },
      'nested.value': { blurred: true },
    },
  });

  context.field.change('name', 'changed');
  context.field.focus('nested.value');
  context.field.blur('nested.value');

  context.core.reset();

  expect(context.core.store.state.fields['~root.name'].meta).toMatchObject({
    dirty: true,
    touched: true,
    blurred: false,
  });
  expect(context.core.store.state.fields['~root.nested.value'].meta).toMatchObject({
    dirty: false,
    touched: true,
    blurred: true,
  });
});

it('resets values, fields, and status by default', () => {
  using context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setErrors('name', [{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  context.field.register('name')(element);
  context.core.persisted.setState(state => {
    return {
      ...state,
      status: {
        ...state.status,
        dirty: true,
        submits: 3,
        submitting: true,
        successful: true,
      },
    };
  });

  context.core.reset();

  expect(context.core.store.state.values).toEqual(defaultValues);
  expect(context.core.store.state.fields['~root.name'].errors).toEqual([]);
  expect(context.core.store.state.fields['~root.name'].ref).toBeNull();
  expect(context.core.store.state.fields['~root.name'].meta.dirty).toBe(false);
  expect(context.core.store.state.status.submits).toBe(0);
  expect(context.core.store.state.status.submitting).toBe(false);
  expect(context.core.store.state.status.successful).toBe(false);
  expect(context.core.store.state.status.dirty).toBe(false);
});

it('resets to custom values and status', () => {
  using context = setup();

  context.core.reset({
    values: {
      name: 'custom',
      nested: {
        value: 'custom nested',
      },
    },
    status: {
      dirty: true,
      successful: true,
    },
  });

  expect(context.core.store.state.values).toEqual({
    name: 'custom',
    nested: {
      value: 'custom nested',
    },
  });
  expect(context.core.store.state.status.dirty).toBe(true);
  expect(context.core.store.state.status.successful).toBe(true);
  expect(context.core.store.state.status.submits).toBe(0);
});

it('keeps fields when keep.fields is true', () => {
  using context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setErrors('name', [{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  context.field.register('name')(element);

  context.core.reset({ keep: { fields: true } });

  expect(context.core.store.state.values).toEqual(defaultValues);
  expect(context.core.store.state.fields['~root.name'].errors).toHaveLength(1);
  expect(context.core.store.state.fields['~root.name'].ref).toBe(element);
  expect(context.core.store.state.fields['~root.name'].meta.dirty).toBe(true);
});

it('keeps refs and errors when requested without keep.fields', () => {
  using context = setup();
  const element = document.createElement('input');

  context.field.change('name', 'changed');
  context.field.setErrors('name', [{ code: 'custom', message: 'issue', path: ['name'] } as never]);
  context.field.register('name')(element);

  context.core.reset({ keep: { refs: true, errors: true } });

  expect(context.core.store.state.fields['~root.name'].errors).toHaveLength(1);
  expect(context.core.store.state.fields['~root.name'].ref).toBe(element);
  expect(context.core.store.state.fields['~root.name'].meta.dirty).toBe(false);
  expect(context.core.store.state.fields['~root.name'].meta.touched).toBe(false);
});
