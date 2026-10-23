import type { FormChecksMap, createForm } from '@oxform/core';

export type CreateFormReturn<
  Values,
  Checks extends FormChecksMap<NoInfer<Values>, string> | undefined = {},
> = ReturnType<typeof createForm<Values, Checks>>;
