import { selectProperties } from '#internal/select-properties';
import type { FormStatus } from '@oxform/core';
import type { Accessor } from 'solid-js';

export const selectFormStatus = <Level extends string>(source: Accessor<FormStatus<Level>>): FormStatus<Level> =>
  selectProperties(source, [
    'dirty',
    'valid',
    'submitting',
    'successful',
    'validating',
    'submits',
    'submitted',
    'blurred',
    'touched',
    'pristine',
  ]);
