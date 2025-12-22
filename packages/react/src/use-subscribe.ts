import { useStore } from '@tanstack/react-store';
import { type AnyFormLikeApi, type ApiSelector } from 'oxform-core';

export const useSubscribe = <Api extends AnyFormLikeApi, Selected>(api: Api, selector: ApiSelector<Api, Selected>) => {
  return useStore(api.store() as never, selector as never) as Selected;
};

// const schema = z.object({ name: z.string(), names: z.string().array() });
// const form = new FormApi({ schema, defaultValues: { name: 'John', names: ['Jane', 'Bob'] } });
// const field = new FieldApi({ form, name: 'name' });
// const array = new ArrayFieldApi({ form, name: 'names' });

// const a = useSubscribe(form, state => state.values);
// const b = useSubscribe(field, state => state.value);
// const c = useSubscribe(array, state => state.value);
