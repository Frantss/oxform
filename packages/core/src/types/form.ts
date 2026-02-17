import { FormApi } from '#form/form-api';
import type { ArrayDeepKeys, DeepKeys, DeepValue } from '#types/deep';

export type AnyFormApi = FormApi<any>;

export type FormValues<Form extends AnyFormApi> = Form extends FormApi<infer Values> ? Values : never;

export type FormFields<Form extends AnyFormApi> = DeepKeys<FormValues<Form>>;

export type FormArrayFields<Form extends AnyFormApi> = ArrayDeepKeys<FormValues<Form>>;

export type FormFieldValue<Form extends AnyFormApi, Name extends FormFields<Form>> = DeepValue<FormValues<Form>, Name>;
