import type { Derived, Store } from '@tanstack/store';

export type FormLikeStore<State = any> = Store<State> | Derived<State>;
