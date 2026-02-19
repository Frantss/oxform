import type { FieldPluginsInput } from '#types/api/field-plugins-input';
import type { DeepKeys, DeepValue } from '#types/deep';

export type FormWithOptions<Values> = Partial<
  {
    '*': FieldPluginsInput<any>;
  } & {
    [Name in DeepKeys<Values>]: FieldPluginsInput<DeepValue<Values, Name>>;
  }
>;
