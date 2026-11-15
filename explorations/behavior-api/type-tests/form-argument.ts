import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type FormDefinition,
  type FormKind,
  type ValuesApi,
  configureForm,
  defineExtension,
  standardForm,
} from '../api';

declare const schema: StandardSchemaV1<{ name: string; age: number }>;

interface FlushKind extends FormKind {
  readonly options: {};
  readonly state: {};
  readonly api: { readonly flush: () => void };
  readonly parts: {};
  readonly fieldExtras: this['path'] extends 'name' ? { readonly shout: () => string } : {};
}
declare const withFlush: ReturnType<
  typeof defineExtension<{ values: ValuesApi<any>; field: (path: never) => unknown }, FlushKind>
>;

type BareApi<Values> = { readonly values: ValuesApi<Values> };
interface BareKind extends FormKind {
  readonly api: BareApi<this['values']>;
}
declare const bare: FormDefinition<BareKind>;
// @ts-expect-error the base has no `field`, which the extension needs
withFlush(bare);

// `onSubmit` and `onInvalid` receive the form with the extension's api and field extras.
configureForm(withFlush(standardForm), {
  schema,
  defaultValues: { name: '', age: 0 },
  onSubmit: (values, form) => {
    form.flush();
    form.field('name').shout();
    values.name satisfies string;
  },
  onInvalid: (_issues, form) => {
    form.flush();
  },
});

// The base preset still has no extension members.
configureForm(standardForm, {
  schema,
  defaultValues: { name: '', age: 0 },
  onSubmit: (_values, form) => {
    // @ts-expect-error no extension, no `flush`
    form.flush();
    // @ts-expect-error no extension, no `shout`
    form.field('name').shout();
    form.field('name').error();
  },
});

// Extras still follow the path: `age` has no `shout`.
configureForm(withFlush(standardForm), {
  schema,
  defaultValues: { name: '', age: 0 },
  onSubmit: (_values, form) => {
    // @ts-expect-error `shout` is only on `name`
    form.field('age').shout();
  },
});
