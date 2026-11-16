import type { StandardSchemaV1 } from '@standard-schema/spec';
import { createContext } from './context';
import type {
  BaseOptions,
  Extendable,
  Extension,
  Form,
  FormContext,
  NeedNames,
  OptionDescriptor,
  OptionDescriptors,
  OptionKind,
  OptionsFrom,
} from './types';

type Options = Record<string, unknown>;

/** What `defineExtension` returns at runtime: the object it was given. */
type Definition = {
  readonly name: string;
  readonly needs?: NeedNames;
  readonly options?: Readonly<Record<string, OptionDescriptor>>;
  readonly state?: (options: Options) => Options;
  api(context: FormContext<Options, Options>, deps: Options): object;
};

type Chain = {
  readonly definitions: readonly Definition[];
  readonly optionKinds: Readonly<Record<string, OptionKind>>;
};

/** The options of every form. An extension cannot declare them again. */
const baseOptionKinds: Readonly<Record<string, OptionKind>> = { id: 'id', schema: 'value', defaultValues: 'value' };
const instanceKeys = new Set(['id', 'store', 'destroy']);

const chains = new WeakMap<object, Chain>();
let instanceCount = 0;

const chainOf = (form: object): Chain => {
  const chain = chains.get(form);
  if (!chain) throw new TypeError('This function expects a form made by defineForm.');
  return chain;
};

/** Records the kind of each option of the chain. An option name with an owner already throws, and names both. */
const kindsOf = (definitions: readonly Definition[]) => {
  const kinds: Record<string, OptionKind> = { ...baseOptionKinds };
  const owners = new Map<string, string>();
  for (const definition of definitions) {
    for (const [name, descriptor] of Object.entries(definition.options ?? {})) {
      const owner = owners.get(name);
      if (name in kinds) {
        const which = owner === undefined ? 'the form has' : `"${owner}" already declares`;
        throw new Error(`The "${definition.name}" extension declares the option "${name}", which ${which}.`);
      }
      owners.set(name, definition.name);
      kinds[name] = descriptor.kind;
    }
  }
  return kinds;
};

/** A need that no earlier extension meets throws, before the `api` of the extension runs (D52). */
const checkNeeds = (definition: Definition, api: object, state: object) => {
  for (const need of definition.needs?.api ?? []) {
    if (!(need in api)) {
      throw new Error(`The "${definition.name}" extension needs "${need}", which no earlier extension provides.`);
    }
  }
  for (const need of definition.needs?.state ?? []) {
    if (!(need in state)) {
      throw new Error(
        `The "${definition.name}" extension needs the state key "${need}", which no earlier extension provides.`,
      );
    }
  }
};

/** A copy of the api so far. Descriptors are copied, because a member may be a getter that must stay live. */
const copyOf = (api: object): Options => Object.defineProperties({}, Object.getOwnPropertyDescriptors(api));

/**
 * Runs the extensions in order. Each one gets the api of the ones before it. A key that two extensions return
 * throws, and the message names both. When an extension throws, the context is destroyed and no instance exists.
 */
const createInstance = (definitions: readonly Definition[], options: Options) => {
  const controls = createContext(options);
  const api: Options = {};
  const owners = new Map<string, string>();

  try {
    for (const definition of definitions) {
      checkNeeds(definition, api, controls.store.state);
      const context = controls.extensionContext(definition.name, definition.state?.(options) ?? {});
      const additions = definition.api(context as FormContext<Options, Options>, copyOf(api));
      for (const key of Object.keys(additions)) {
        const owner = owners.get(key);
        if (owner !== undefined || instanceKeys.has(key)) {
          const which = owner === undefined ? 'the instance has' : `"${owner}" already returns`;
          throw new Error(`The "${definition.name}" extension returns "${key}" from api, which ${which}.`);
        }
        owners.set(key, definition.name);
      }
      Object.defineProperties(api, Object.getOwnPropertyDescriptors(additions));
    }
  } catch (error) {
    controls.destroy();
    throw error;
  }

  const instance = Object.defineProperties(api, {
    id: { value: options.id, enumerable: true },
    store: { value: controls.store, enumerable: true },
    destroy: { value: () => controls.destroy(), enumerable: true },
  });
  controls.bindInstance(instance);
  return instance;
};

type FormInit = Options & { readonly name?: string };

const makeForm = (init: FormInit, definitions: readonly Definition[], configured: Options): object => {
  const { name = 'form', ...initOptions } = init;
  const chain: Chain = { definitions, optionKinds: kindsOf(definitions) };

  const form = {
    name,
    extend(extension: (form: object) => object) {
      const result = extension(form);
      return chains.has(result) ? result : makeForm(init, [...definitions, result as Definition], configured);
    },
    configure: (options: Options) => makeForm(init, definitions, { ...configured, ...options }),
    create(options: Options = {}) {
      const merged = { ...initOptions, ...configured, ...options };
      return createInstance(definitions, { ...merged, id: merged.id ?? `form-${++instanceCount}` });
    },
  };
  chains.set(form, chain);
  return form;
};

/** Makes a form with no extension. `schema` only types `Values`. */
export const defineForm = <Values>(init: {
  readonly name?: string;
  readonly id?: string;
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: NoInfer<Values>;
}): Form<Values> => makeForm(init, [], {}) as Form<Values>;

/** Defines one extension as one object. `form` only carries the types: it gives `Values` and the needs. */
export const defineExtension = <
  Values,
  Provides,
  NeedState,
  Descriptors extends OptionDescriptors = {},
  State extends object = {},
  Api extends object = {},
>(
  _form: Extendable<Values, Provides, NeedState>,
  definition: {
    readonly name: string;
    readonly needs?: NeedNames;
    readonly options?: Descriptors;
    /** Runs once per instance, with the merged options. The store starts from its result. */
    readonly state?: (options: BaseOptions<Values> & OptionsFrom<Descriptors>) => State;
    /** Runs once per instance, on a server too. It must be inert: no DOM, no timer, no request. */
    readonly api: (context: FormContext<BaseOptions<Values> & OptionsFrom<Descriptors>, State>, deps: Provides) => Api;
  },
): Extension<OptionsFrom<Descriptors>, State, Api> => definition as never;

/** The typed option descriptors. At runtime a descriptor is its kind. */
export const option: {
  string<Type extends string = string>(): OptionDescriptor<Type, 'string'>;
  number(): OptionDescriptor<number, 'number'>;
  boolean(): OptionDescriptor<boolean, 'boolean'>;
  list<Type extends readonly unknown[] = readonly string[]>(): OptionDescriptor<Type, 'list'>;
  value<Type>(): OptionDescriptor<Type, 'value'>;
  callback<Type extends (...args: any[]) => unknown>(): OptionDescriptor<Type, 'callback'>;
  action<Type extends (...args: any[]) => unknown>(): OptionDescriptor<Type, 'action'>;
  id(): OptionDescriptor<string, 'id'>;
  key(): OptionDescriptor<string, 'key'>;
} = {
  string: () => ({ kind: 'string' }),
  number: () => ({ kind: 'number' }),
  boolean: () => ({ kind: 'boolean' }),
  list: () => ({ kind: 'list' }),
  value: () => ({ kind: 'value' }),
  callback: () => ({ kind: 'callback' }),
  action: () => ({ kind: 'action' }),
  id: () => ({ kind: 'id' }),
  key: () => ({ kind: 'key' }),
};

/** The runtime kind of every option of a form, for an adapter. */
export const optionKindsOf = (form: object): Readonly<Record<string, OptionKind>> => chainOf(form).optionKinds;

/** The names of the extensions of a form, in order. TK-014 replaces it with the resolved slots. */
export const slotsOf = (form: object): readonly string[] =>
  chainOf(form).definitions.map(definition => definition.name);

export type SlotDefinition = { readonly name: string; readonly slots: Readonly<Record<string, object>> };

export const defineSlots = (definition: { name: string }, build: () => Record<string, object>): SlotDefinition => ({
  name: definition.name,
  slots: build(),
});
