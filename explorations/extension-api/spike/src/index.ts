// The public entry of the spike, standing in for `@oxform/core`. Types come from `api.ts`, values from the modules
// that implement them. `@oxform/core/standard` is `standard.ts` and `@oxform/react` is `react/create-parts.tsx`.
export type * from './api';

export { defineExtension, defineForm, defineSlots, on, option, slots } from './form';
export { defineScope } from './scopes';
export { createEffect } from './effect';
export { get, idPart, fieldErrorSlots, fieldSlots, resetSlots, rootSlots, submitSlots } from './slots';

export { arrays, createArray } from './arrays';
export { check, createCheck } from './check';
export { createFieldEvents, events } from './events';
export { createHandles, handles } from './handles';
export { createReset, reset } from './reset';
export { createFieldStatus, status } from './status';
export { createSubmit, submit } from './submit';
export { createValidation, validation } from './validation';
export { createValues, values } from './values';
export { createChange } from './change';
