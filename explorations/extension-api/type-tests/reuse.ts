import type { StandardSchemaV1 } from '@standard-schema/spec';
import { autosave } from '../kit/autosave';
import { warnings } from '../kit/warnings';
import { defineForm } from '../spike/src/api';
import { standard } from '../spike/src/standard';
import { validation } from '../spike/src/validation';
import { values } from '../spike/src/values';

// A reusable extension states what it needs from a form, not which form it is.
declare const schema: StandardSchemaV1<{ a: string }>;
const base = defineForm({ schema, defaultValues: { a: '' } });

// Form 1: the preset
base.extend(standard).extend(autosave);

// Form 2: a lean form with values and validation only
base.extend(values).extend(validation).extend(autosave);

// Form 3: no validation extension. The need rejects it.
// @ts-expect-error missing validation
base.extend(values).extend(autosave);

// The order matters: a need comes before its user.
// @ts-expect-error validation comes after autosave
base.extend(values).extend(autosave).extend(validation);

// Chaining two reusable extensions keeps both apis, typed by the form's values
export const both = base.extend(standard).extend(autosave).extend(warnings).create();
both.autosave.flush();
both.warning.at('a');
// @ts-expect-error path typed through the chain
both.warning.at('nope');
both.field('a');
both.store.state.autosave.saving satisfies boolean;
both.store.state.warning;
