import { FormApi } from '#form/form-api';
import type { ArrayDeepKeys, DeepKeys, DeepValue } from '#types/deep';
import type { Derived, Store } from '@tanstack/store';

export type AnyFormApi = FormApi<any>;
export type FormLikeStore<State = any> = Store<State> | Derived<State>;
export type AnyFormLikeApi = {
  store: FormLikeStore;
};
export type ApiSelector<Api extends AnyFormLikeApi, Selected> = (state: Api['store']['state']) => Selected;

export type FormValues<Form extends AnyFormApi> = Form extends FormApi<infer Values> ? Values : never;

export type FormFields<Form extends AnyFormApi> = DeepKeys<FormValues<Form>>;

export type FormArrayFields<Form extends AnyFormApi> = ArrayDeepKeys<FormValues<Form>>;

export type FormFieldValue<Form extends AnyFormApi, Name extends FormFields<Form>> = DeepValue<FormValues<Form>, Name>;
