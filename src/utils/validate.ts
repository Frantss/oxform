import type { StandardSchemaV1 } from '@standard-schema/spec';

export const validate = async <Schema extends StandardSchemaV1>(schema: Schema, input: unknown) => {
  let result = schema['~standard'].validate(input);
  if (result instanceof Promise) result = await result;

  return result as StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>;
};
