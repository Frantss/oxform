import type { StandardSchemaV1 } from '@standard-schema/spec';
import { createContext, type FieldsDefinition } from './context';
import type {
  BaseOptions,
  Extendable,
  Extension,
  FieldMembers,
  FieldOf,
  Form,
  FormContext,
  NeedNames,
  NeedsMember,
  OptionDescriptor,
  OptionDescriptors,
  OptionKind,
  OptionsFrom,
  SlotFactory,
  SlotRecord as PublicSlotRecord,
} from './types';

type Options = Record<string, unknown>;

/** What `defineExtension` returns at runtime: the object it was given. */
type Definition = {
  readonly name: string;
  readonly needs?: NeedNames;
  readonly options?: Readonly<Record<string, OptionDescriptor>>;
  readonly state?: (options: Options) => Options;
  api(context: FormContext<Options, Options>, deps: Options): object;
  readonly fields?: FieldsDefinition;
  readonly slots?: (slot: typeof slotFactory) => SlotRecord;
};

/** A slot is plain data, so the factory that `slots` and a slot group get is the identity. */
const slotFactory = <Slot extends object>(definition: Slot) => definition;

type SlotRecord = Readonly<Record<string, object>>;

/** The slot group of each slot that a group made, with the needs that the group states. */
const groups = new WeakMap<object, { readonly name: string; readonly needs?: NeedNames }>();

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

/** A need that the api or the state so far does not meet throws. `owner` names the extension or the slot group. */
const checkNeeds = (owner: string, needs: NeedNames | undefined, api: object, state: object) => {
  for (const need of needs?.api ?? []) {
    if (!(need in api)) throw new Error(`${owner} needs "${need}", which no earlier extension provides.`);
  }
  for (const need of needs?.state ?? []) {
    if (!(need in state))
      throw new Error(`${owner} needs the state key "${need}", which no earlier extension provides.`);
  }
};

/** The needs of each slot group in the slots of an extension, checked once the extension has run. */
const checkGroups = (definition: Definition, api: object, state: object) => {
  const checked = new Set<string>();
  for (const slot of Object.values(definition.slots?.(slotFactory) ?? {})) {
    const group = groups.get(slot);
    if (group === undefined || checked.has(group.name)) continue;
    checked.add(group.name);
    checkNeeds(`The "${group.name}" slot group`, group.needs, api, state);
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
  for (const definition of definitions) if (definition.fields) controls.addFields(definition.name, definition.fields);

  try {
    for (const definition of definitions) {
      checkNeeds(`The "${definition.name}" extension`, definition.needs, api, controls.store.state);
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
      checkGroups(definition, api, controls.store.state);
    }
    const withFields = definitions.find(definition => definition.fields);
    if (withFields && typeof api.field !== 'function') {
      throw new Error(`The "${withFields.name}" extension adds field members, so the form needs a field(path) api.`);
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
  const ApiNames extends readonly (keyof Provides & string)[] = [],
  const StateNames extends readonly (keyof NeedState & string)[] = [],
  Descriptors extends OptionDescriptors = {},
  State extends object = {},
  Api extends object = {},
  Slots extends PublicSlotRecord = {},
  Fields = never,
>(
  _form: Extendable<Values, Provides, NeedState>,
  definition: {
    readonly name: string;
    readonly options?: Descriptors;
    /** Runs once per instance, with the merged options. The store starts from its result. */
    readonly state?: (options: BaseOptions<Values> & OptionsFrom<Descriptors>) => State;
    /** Runs once per instance, on a server too. It must be inert: no DOM, no timer, no request. */
    readonly api: (context: FormContext<BaseOptions<Values> & OptionsFrom<Descriptors>, State>, deps: Provides) => Api;
    /** The slots of the extension. `slot` sees the api and the state of the form so far, and its own. */
    readonly slots?: (slot: SlotFactory<Provides & Api, NeedState & State>) => Slots;
    /** Members for field handles, built with `on`. */
    readonly fields?: Fields;
  } & NeedsMember<Provides, NeedState, ApiNames, StateNames>,
): Extension<OptionsFrom<Descriptors>, State, Api, Slots, Fields> => definition as never;

/**
 * Field members for the field handles whose value extends `Condition`: `fields: on<string>(isString)(build)`. The
 * types are erased at runtime, so `guard` decides there. Without a guard, the members go on every field. `path`
 * is relative to the scope of the handle.
 */
export const on =
  <Condition = unknown>(guard?: (value: unknown) => value is Condition) =>
  <Members extends object>(
    build: (field: FieldOf<Condition>, path: string) => Members,
  ): FieldMembers<Condition, Members> =>
    ({ guard, build }) as never;

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

/**
 * The slots of a form, in the order of its extensions. A slot with the key of an earlier slot replaces it. An adapter
 * reads them to render the parts.
 */
export const slotsOf = (form: object): SlotRecord =>
  Object.assign({}, ...chainOf(form).definitions.map(definition => definition.slots?.(slotFactory)));

/**
 * A reusable group of slots. `build` annotates its `slot` parameter with what the slots need
 * (`SlotFactory<Api, State>`), and `needs` lists the same names. Each slot records the group, so `create` checks
 * the needs once the extension that spreads the group has run.
 */
export const defineSlots = <
  Api,
  State,
  Slots extends PublicSlotRecord,
  const ApiNames extends readonly (keyof Api & string)[] = [],
  const StateNames extends readonly (keyof State & string)[] = [],
>(
  definition: { readonly name: string } & NeedsMember<Api, State, ApiNames, StateNames>,
  build: (slot: SlotFactory<Api, State>) => Slots,
): ((slot: SlotFactory<Api, State>) => Slots) => {
  const group = { name: definition.name, needs: (definition as { readonly needs?: NeedNames }).needs };
  return slot => {
    const slots = build(slot);
    for (const made of Object.values(slots)) groups.set(made, group);
    return slots;
  };
};

/**
 * An extension that adds slots only: no api, no option and no state. `slot` is typed by the api and the state of
 * the form, so each spread group checks its needs there. A later slot with the key of an earlier one replaces it.
 */
export const slots =
  <Values, Provides, NeedState, Slots extends PublicSlotRecord>(
    build: (slot: SlotFactory<Provides, NeedState>) => Slots,
  ) =>
  (_form: Extendable<Values, Provides, NeedState>): Extension<{}, {}, {}, Slots> =>
    ({ name: 'slots', api: () => ({}), slots: build }) as never;
