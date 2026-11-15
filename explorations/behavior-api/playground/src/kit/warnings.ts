import type {
  CheckApi,
  CheckState,
  EventValidators,
  FormKind,
  PartSpec,
  Path,
  ValidationApi,
  ValuesApi,
} from '../../../api';
import { createCheck } from '../../../spike/src/check';
import { defineExtension } from '../../../spike/src/form';

type WarningOptions<Values> = { readonly warning?: EventValidators<Values> };
type WarningApi<Values> = { readonly warning: CheckApi<Values, 'warning'> };
type WarningParts<Values> = {
  readonly fieldWarning: PartSpec<{ readonly name: Path<Values> }, { readonly messages: readonly string[] }>;
};

interface WarningKind extends FormKind {
  readonly options: WarningOptions<this['values']>;
  readonly state: { readonly warning: CheckState };
  readonly api: WarningApi<this['values']>;
  readonly parts: WarningParts<this['values']>;
  readonly checks: 'warning';
}

/**
 * Advice that does not stop a submit. Adds a `warning` check, a `warning` option with the validators of each event,
 * and a `fieldWarning` part that shows the messages of one field.
 */
export const withWarnings = defineExtension<{ values: ValuesApi<any>; validation: ValidationApi<any> }, WarningKind>({
  name: 'warnings',
  options: { warning: 'value' },
  api: (ctx, { values, validation }) => ({ warning: createCheck(ctx, { values, validation }, { name: 'warning' }) }),
  slots: slot => ({
    fieldWarning: slot({
      props: { name: 'key' },
      present: (state, part) => (state.warning[part.key] ?? []).length > 0,
      state: (state, part) => ({ messages: (state.warning[part.key] ?? []).map(entry => entry.message) }),
      attrs: () => ({ role: 'status', className: 'warning' }),
    }),
  }),
});
