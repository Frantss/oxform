import type { StandardSchemaV1 } from '@standard-schema/spec';
import { createContext, type FieldsDefinition } from './context';
import type { ScopeDefinition, ScopedValues } from './scopes';
import type {
  AdapterControls,
  BaseOptions,
  Extendable,
  Extension,
  FieldMembers,
  FieldOf,
  Form,
  FormContext,
  NeedNames,
  NeedsMember,
  OptionTypes,
  SlotFactory,
  SlotRecord as PublicSlotRecord,
} from './types';

type Options = Record<string, unknown>;

/** What `defineExtension` returns at runtime: the object it was given. */
type Definition = {
  readonly name: string;
  readonly needs?: NeedNames;
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

const instanceKeys = new Set(['id', 'store', 'destroy']);

/** The extensions of each form, in order. */
const chains = new WeakMap<object, readonly Definition[]>();
let instanceCount = 0;

const chainOf = (form: object): readonly Definition[] => {
  const chain = chains.get(form);
  if (!chain) throw new TypeError('This function expects a form made by defineForm.');
  return chain;
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
const adapterControls = new WeakMap<object, AdapterControls>();

const createInstance = (
  definitions: readonly Definition[],
  options: Options,
  merge: (next: Options) => Options,
  verify: (api: object) => void,
) => {
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
    verify(api);
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
  adapterControls.set(instance, {
    setOptions: next => controls.setOptions(merge({ id: options.id, ...next })),
    unmount: () => controls.unmount(),
  });
  return instance;
};

/** A scope definition places itself through this key (`main/scopes.ts`), so this module never imports it. */
const MOUNT = Symbol.for('oxform.scope.mount');
const VERIFY = Symbol.for('oxform.scope.verify');

/**
 * The prefix of a scope that `handles` made, under a symbol so a spread of the scope keeps it. It is not on `Scope`:
 * an adapter reads it with `prefixOf` to resolve the names of a part against the scope it was given.
 */
export const scopePrefix = Symbol.for('oxform.scope.prefix');

type Mount = (options: Options, path: string, layers: readonly [Options, Options, Options]) => Options;
type Verify = (api: object, path: string) => void;

type FormInit = Options & { readonly name?: string; readonly scopes?: Readonly<Record<string, object>> };

const makeForm = (init: FormInit, definitions: readonly Definition[], configured: Options): object => {
  const { name = 'form', scopes = {}, ...initOptions } = init;

  /** The options of `create` win over those of `configure`, and those over the options of `defineForm`. */
  const merge = (options: Options) => {
    let merged: Options = { ...initOptions, ...configured, ...options };
    for (const [path, scope] of Object.entries(scopes)) {
      merged = (scope as Record<symbol, Mount>)[MOUNT]!(merged, path, [initOptions, configured, options]);
    }
    return merged;
  };

  const verify = (api: object) => {
    for (const [path, scope] of Object.entries(scopes)) (scope as Record<symbol, Verify>)[VERIFY]!(api, path);
  };

  const form = {
    name,
    extend(extension: (form: object) => object) {
      const result = extension(form);
      return chains.has(result) ? result : makeForm(init, [...definitions, result as Definition], configured);
    },
    configure: (options: Options) => makeForm(init, definitions, { ...configured, ...options }),
    create(options: Options = {}) {
      const merged = merge(options);
      return createInstance(definitions, { ...merged, id: merged.id ?? `form-${++instanceCount}` }, merge, verify);
    },
  };
  chains.set(form, definitions);
  return form;
};

/** The scope keys that a form cannot use: a key of its own values, and a dotted key (rules 1 and 5). */
type ForbiddenScopeKey<Base> = (keyof Base & string) | `${string}.${string}`;

type DefineForm = {
  /** Makes a form with no extension. `schema` only types `Values`. */
  <Values>(init: {
    readonly name?: string;
    readonly id?: string;
    readonly schema: StandardSchemaV1<Values>;
    readonly defaultValues: NoInfer<Values>;
  }): Form<Values>;
  /** With scopes: `schema` and `defaultValues` describe the own values of the form, and each scope adds its own. */
  <Base, const Scopes extends Readonly<Record<string, ScopeDefinition<any>>>>(init: {
    readonly name?: string;
    readonly id?: string;
    readonly schema: StandardSchemaV1<Base>;
    readonly defaultValues: NoInfer<Base>;
    readonly scopes: Scopes & { readonly [Key in keyof Scopes & ForbiddenScopeKey<Base>]: never };
  }): Form<Base & ScopedValues<Scopes>>;
};

export const defineForm: DefineForm = (init: FormInit) => makeForm(init, [], {}) as never;

/** Defines one extension as one object. `form` only carries the types: it gives `Values` and the needs. */
export const defineExtension = <
  Values,
  Provides,
  NeedState,
  Whole extends boolean,
  const ApiNames extends readonly (keyof Provides & string)[] = [],
  const StateNames extends readonly (keyof NeedState & string)[] = [],
  Options extends object = {},
  State extends object = {},
  Api extends object = {},
  Slots extends PublicSlotRecord = {},
  Fields = never,
>(
  _form: Extendable<Values, Provides, NeedState, Whole>,
  definition: {
    readonly name: string;
    /** The types of the options of the extension, from `optionTypes`. */
    readonly options?: OptionTypes<Options>;
    /** Runs once per instance, with the merged options. The store starts from its result. */
    readonly state?: (options: BaseOptions<Values> & Partial<Options>) => State;
    /** Runs once per instance, on a server too. It must be inert: no DOM, no timer, no request. */
    readonly api: (context: FormContext<BaseOptions<Values> & Partial<Options>, State>, deps: Provides) => Api;
    /** The slots of the extension. `slot` sees the api and the state of the form so far, and its own. */
    readonly slots?: (slot: SlotFactory<Provides & Api, NeedState & State>) => Slots;
    /** Members for field handles, built with `on`. */
    readonly fields?: Fields;
  } & NeedsMember<Provides, NeedState, ApiNames, StateNames, Whole>,
): Extension<Partial<Options>, State, Api, Slots, Fields> => definition as never;

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

/**
 * The options of an extension, as one type: `options: optionTypes<{ limit: number }>()`. Every option is optional in
 * `configure` and `create`. It is only a type: nothing reads the options of an extension at runtime.
 */
export const optionTypes = <Options extends object>(): OptionTypes<Options> => ({});

/** The adapter controls of an instance. Only an adapter calls it (D17). */
export const adapterControlsOf = (instance: object): AdapterControls => {
  const found = adapterControls.get(instance);
  if (!found) throw new TypeError('adapterControlsOf expects an instance made by form.create.');
  return found;
};

/**
 * The slots of a form, in the order of its extensions. A slot with the key of an earlier slot replaces it. An adapter
 * reads them to render the parts.
 */
export const slotsOf = (form: object): SlotRecord =>
  Object.assign({}, ...chainOf(form).map(definition => definition.slots?.(slotFactory)));

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

/** The prefix of a scope from `handles`, or `''` for an object that is not a scope. */
export const prefixOf = (scope: object | undefined): string =>
  (scope as { readonly [scopePrefix]?: string } | undefined)?.[scopePrefix] ?? '';
