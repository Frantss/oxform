import type { EventLike, FieldApi, FieldExtra } from 'oxform-core';

export type UseFieldReturn<Value, Extra extends FieldExtra> = FieldApi<Value, Extra> & {
  props: {
    value: Value;
    ref: (element: HTMLElement | null) => void;
    onChange: (event: EventLike) => void;
    onBlur: (event: EventLike) => void;
    onFocus: (event: EventLike) => void;
  };
};
