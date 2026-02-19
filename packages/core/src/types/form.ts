import { FormApi } from '#form/form-api';
import type { ArrayDeepKeys, DeepKeys, DeepValue } from '#types/deep';
import type { Simplify } from '#types/misc';
import type { Derived, Store } from '@tanstack/store';

export type AnyFormApi = FormApi<any, any>;
export type FormLikeStore<State = any> = Store<State> | Derived<State>;
export type AnyFormLikeApi = {
  store: FormLikeStore;
};
export type ApiSelector<Api extends AnyFormLikeApi, Selected> = (state: Api['store']['state']) => Selected;

export type FormValues<Form extends AnyFormApi> = Form extends FormApi<infer Values, any> ? Values : never;

export type FormFields<Form extends AnyFormApi> = DeepKeys<FormValues<Form>>;

export type FormArrayFields<Form extends AnyFormApi> = ArrayDeepKeys<FormValues<Form>>;

export type FormFieldValue<Form extends AnyFormApi, Name extends FormFields<Form>> = DeepValue<FormValues<Form>, Name>;

type UnionToIntersection<Union> = (
  Union extends any ? (value: Union) => void : never
) extends (value: infer Intersection) => void
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
