import type * as Api from './api';
import { createContext, type FieldsDefinition } from './context';

type Options = Record<string, unknown>;

/** A slot definition is plain data. The adapter reads it, so the kernel's `slot` factory is the identity. */
const slotFactory = <Definition extends object>(definition: Definition) => definition;
type SlotFactory = typeof slotFactory;
type SlotRecord = Record<string, object>;

/** What `defineExtension` returns at runtime: the object it was given. The `form` argument only carries types. */
interface ExtensionDefinition {
  readonly name: string;
  readonly options?: Readonly<Record<string, Api.OptionDescriptor>>;
  readonly state?: (options: Options) => Record<string, unknown>;
  api(ctx: Api.FormContext<any, any>, deps: any): object;
  readonly slots?: (slot: SlotFactory) => SlotRecord;
  readonly fields?: FieldsDefinition;
}

/** The options every form has. An extension cannot declare them again. */
const baseOptionKinds: Readonly<Record<string, Api.OptionKind>> = {
  id: 'id',
  schema: 'value',
  defaultValues: 'value',
};
const instanceKeys = ['id', 'store', 'destroy'];

export const defineExtension = ((_form: unknown, definition: ExtensionDefinition) =>
  definition) as unknown as typeof Api.defineExtension;

/** The typed option descriptors. At runtime a descriptor is its kind. */
export const option = Object.fromEntries(
  ['string', 'number', 'boolean', 'list', 'value', 'callback', 'action', 'id', 'key'].map(kind => [
    kind,
    () => ({ kind }),
  ]),
) as unknown as typeof Api.option;

/** `on(guard)(build)`: field members, with the runtime test that stands in for the erased type. */
export const on = ((guard?: (value: unknown) => boolean) => (build: FieldsDefinition['build']) => ({
  guard,
  build,
})) as unknown as typeof Api.on;

/** A group of slots is a function of the slot factory. Its needs are checked by the types only. */
export const defineSlots = (<Build extends (slot: SlotFactory) => SlotRecord>(build: Build) =>
  build) as unknown as typeof Api.defineSlots;

/** An extension of slots only: `build` is the extension's `slots`, and it adds no api, options or state. */
export const slots = ((build: (slot: SlotFactory) => SlotRecord) => (form: unknown) =>
  defineExtension(
    form as never,
    { name: 'slots', api: () => ({}), slots: build } as never,
  )) as unknown as typeof Api.slots;

const extensionList = new WeakMap<object, readonly ExtensionDefinition[]>();
const extensionsOf = (form: object) => extensionList.get(form) ?? [];

/**
 * The slots of a form, resolved with the kernel's factory, in the order of its extensions. A slot with the key of
 * an earlier slot replaces it. An adapter reads these to render parts.
 */
export const slotsOf = (form: object): SlotRecord =>
  Object.assign({}, ...extensionsOf(form).map(extension => extension.slots?.(slotFactory)));

/** A scope definition carries its own mount logic under these keys (see `scopes.ts`), so this module never imports it. */
const MOUNT = Symbol.for('oxform.scope.mount');
const VERIFY = Symbol.for('oxform.scope.verify');
type Placeable = Record<symbol, (...args: any[]) => any>;

/**
 * What an adapter needs from an instance, and not part of its public api: new options on each render, and a way to
 * stop the work in progress when the component leaves. Neither ends the instance, so hiding and showing it again
 * (Suspense, Activity, strict mode) needs no rebuild.
 */
export interface AdapterControls {
  setOptions(options: Options): void;
  unmount(): void;
}
const adapterControls = new WeakMap<object, AdapterControls>();
export const adapterControlsOf = (instance: object): AdapterControls => {
  const found = adapterControls.get(instance);
  if (!found) throw new Error('This is not an instance made by a form.');
  return found;
};

/** Records the descriptors of an extension, and throws when an option name has an owner already. */
function declareOptions(
  optionKinds: Record<string, Api.OptionKind>,
  owners: Map<string, string>,
  extension: ExtensionDefinition,
) {
  for (const [name, descriptor] of Object.entries(extension.options ?? {})) {
    const owner = owners.get(name);
    if (name in baseOptionKinds || owner !== undefined)
      throw new Error(
        `The "${extension.name}" extension declares the option "${name}", which ${owner === undefined ? 'the form has' : `"${owner}" already declares`}.`,
      );
    owners.set(name, extension.name);
    optionKinds[name] = descriptor.kind;
  }
}

/**
 * Runs the extensions in order. Each gets the api of the ones before it. The instance is the api, plus `id`,
 * `store` and `destroy`. A key that two extensions return throws, and the message names both.
 */
function createInstance(
  extensions: readonly ExtensionDefinition[],
  options: Options,
  merge: (next: Options) => Options,
) {
  const controls = createContext(options);
  for (const extension of extensions) if (extension.fields) controls.addFields(extension.name, extension.fields);

  const api: Record<string, unknown> = {};
  const owners = new Map<string, string>();
  for (const extension of extensions) {
    const ctx = controls.extensionContext(extension.name, extension.state?.(options) ?? {});
    const additions = extension.api(ctx, api);

    for (const key of Object.keys(additions)) {
      const owner = owners.get(key);
      if (owner !== undefined || instanceKeys.includes(key))
        throw new Error(
          `The "${extension.name}" extension returns "${key}" from api, which ${owner === undefined ? 'the instance has' : `"${owner}" already returns`}.`,
        );
      owners.set(key, extension.name);
    }
    // Descriptors are copied, because an api member may be a getter that must stay live.
    Object.defineProperties(api, Object.getOwnPropertyDescriptors(additions));
  }

  const withFields = extensions.find(extension => extension.fields);
  if (withFields && typeof api.field !== 'function')
    throw new Error(`The "${withFields.name}" extension adds field members, so the form needs a field(path) api.`);

  const instance = Object.defineProperties(api, {
    id: { value: String(options.id ?? ''), enumerable: true },
    store: { value: controls.store, enumerable: true },
    destroy: { value: () => controls.destroy(), enumerable: true },
  });
  controls.bindInstance(instance);
  adapterControls.set(instance, {
    setOptions: next => controls.setOptions(merge(next)),
    unmount: () => controls.unmount(),
  });
  return instance;
}

interface FormInit extends Options {
  readonly name?: string;
  readonly scopes?: Record<string, Placeable>;
}

function makeForm(init: FormInit, extensions: readonly ExtensionDefinition[], defaults: Options = {}): object {
  const { name = 'form', scopes = {}, ...rest } = init;

  const optionKinds: Record<string, Api.OptionKind> = { ...baseOptionKinds };
  const owners = new Map<string, string>();
  for (const extension of extensions) declareOptions(optionKinds, owners, extension);

  /**
   * Later options win: the instance's options over `configure`'s, and those over `defineForm`'s. Scopes are
   * placed into the merged options. Each one gets the layers, so an instance or `configure` can override a scope's
   * default values, key by key.
   */
  const merge = (options: Options) => {
    let merged: Options = { ...rest, ...defaults, ...options };
    for (const [path, scope] of Object.entries(scopes)) merged = scope[MOUNT]!(merged, path, [rest, defaults, options]);
    return merged;
  };

  const create = (options: Options = {}) => {
    const instance = createInstance(extensions, merge(options), merge);
    for (const [path, scope] of Object.entries(scopes)) scope[VERIFY]?.(instance, path);
    return instance;
  };

  const form = {
    name,
    optionKinds,
    extend(extension: (form: object) => object) {
      const result = extension(form);
      // A preset returns a form. An extension returns its definition.
      return 'extend' in result ? result : makeForm(init, [...extensions, result as ExtensionDefinition], defaults);
    },
    configure: (options: Options) => makeForm(init, extensions, { ...defaults, ...options }),
    create,
  };
  extensionList.set(form, extensions);
  return form;
}

export const defineForm = ((init: FormInit) => makeForm(init, [])) as unknown as typeof Api.defineForm;
