import type { AnyArrayFieldApi } from '#array-field-api';
import type { AnyFieldApi } from '#field-api';
import type { AnyFormApi } from '#form-api';

export type AnyFormLikeApi = AnyFormApi | AnyArrayFieldApi | AnyFieldApi;
