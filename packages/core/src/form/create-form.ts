import type { FormOptions } from '#form-api.types';
import { FormCore } from '#form/form-core';
import { FormCoreArray } from '#form/form-core-array-field';
import { FormCoreField } from '#form/form-core-field';
import { FormCoreFields } from '#form/form-core-fields';
import z from 'zod';

export const createForm = <Values>(options: FormOptions<Values>) => {
  const core = new FormCore<Values>(options);
  const fields = new FormCoreFields<Values>({ core });
  const field = new FormCoreField<Values>({ core, fields });
  const array = new FormCoreArray<Values>({ core, fields, field });

  return {
    options: core.options,
    persisted: core.persisted,
    store: core.store,
    field,
    array,
  };
};

export const form = createForm({
  schema: z.object({ complex: z.object({ array: z.string().array() }) }),
  defaultValues: { complex: { array: [] } },
});

export const a = form.field.get('complex.array');
