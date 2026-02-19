import type { Simplify } from 'type-fest';
import type { FormApi } from '#form/form-api';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormFields } from '#types/form/form-fields';

type UnionToIntersection<Union> = (Union extends any ? (value: Union) => void : never) extends (
  value: infer Intersection,
) => void
  ? Intersection
  : never;

type PluginOutput<Plugin> = Plugin extends (...args: any[]) => infer Output ? Output : {};

type PluginsOutput<Input> = [Input] extends [undefined]
  ? {}
  : Input extends readonly (infer Plugin)[]
    ? Simplify<UnionToIntersection<PluginOutput<Plugin>>>
    : Simplify<PluginOutput<Input>>;

type Overwrite<Left, Right> = Simplify<Omit<Left, keyof Right> & Right>;

type FormWith<Form extends AnyFormApi> = Form extends FormApi<any, infer With> ? With : never;

type FormWithGlobalPlugins<Form extends AnyFormApi> = NonNullable<FormWith<Form>>['*'];

type FormWithFieldPlugins<Form extends AnyFormApi, Name extends FormFields<Form>> = NonNullable<FormWith<Form>>[Name];

export type FormFieldExtra<Form extends AnyFormApi, Name extends FormFields<Form>> = Overwrite<
  PluginsOutput<FormWithGlobalPlugins<Form>>,
  PluginsOutput<FormWithFieldPlugins<Form, Name>>
>;
