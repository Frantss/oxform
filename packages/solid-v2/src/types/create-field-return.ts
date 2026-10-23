import type { FieldApi } from '@oxform/core';
import type { JSX } from '@solidjs/web';

export type FieldInputProps<Value> = {
  readonly value: Value;
  ref: (element: HTMLElement | null) => void;
  onInput: JSX.EventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, InputEvent>;
  onBlur: JSX.EventHandler<HTMLElement, FocusEvent>;
  onFocus: JSX.EventHandler<HTMLElement, FocusEvent>;
};

export type CreateFieldReturn<Value, Level extends string = string> = FieldApi<Value, Level> & {
  readonly props: FieldInputProps<Value>;
};
