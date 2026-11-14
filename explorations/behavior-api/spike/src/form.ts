import type * as Api from '../../api';
import { createContext } from './context';

/** A slot definition is plain data. The adapter reads it, so the kernel's `slot` factory is the identity. */
const slotFactory = <Definition extends object>(definition: Definition) => definition;
type SlotFactory = typeof slotFactory;
type SlotRecord = Record<string, object>;

interface DefinitionInput {
  readonly name: string;
  readonly options: Readonly<Record<string, Api.OptionKind>>;
  api(ctx: Api.FormContext<any, any>): object;
  slots?(slot: SlotFactory): SlotRecord;
}

const inputs = new WeakMap<object, DefinitionInput>();

function register(input: DefinitionInput) {
  const definition = { name: input.name, options: input.options };
  inputs.set(definition, input);
  return definition;
}

const inputOf = (definition: object) => inputs.get(definition)!;

export const defineForm = ((input: DefinitionInput) => register(input)) as unknown as typeof Api.defineForm;

/** A group of slots is a function of the slot factory. Its needs are checked by the types only. */
export const defineSlots = (<Build extends (slot: SlotFactory) => SlotRecord>(build: Build) =>
  build) as unknown as typeof Api.defineSlots;

/** The slots of a definition, resolved with the kernel's factory. An adapter reads these to render parts. */
export const slotsOf = (definition: object): SlotRecord => inputOf(definition).slots?.(slotFactory) ?? {};

type ExtensionInput = Partial<Omit<DefinitionInput, 'api' | 'slots'>> & {
  api(ctx: Api.FormContext<any, any>, base: object): object;
  slots?(slot: SlotFactory, base: SlotRecord): SlotRecord;
  fieldExtras?(path: string, field: object): object;
};

/**
 * Adds the extras to a handle. The handle is not spread, because its `state` is a getter that must stay live, so
 * property descriptors are copied. An extra cannot redefine a member of the base handle.
 */
function addMembers(handle: object, extras: object, extension: string): object {
  for (const key of Object.keys(extras))
    if (key in handle) throw new Error(`The "${extension}" extension cannot redefine the field member "${key}".`);

  return Object.defineProperties(
    {},
    { ...Object.getOwnPropertyDescriptors(handle), ...Object.getOwnPropertyDescriptors(extras) },
  );
}

type FieldExtension = Required<Pick<ExtensionInput, 'fieldExtras'>> & { name: string };
type Handles = { field?: unknown; scope?: unknown };

/**
 * Wraps `field(path)` so every handle it returns carries the extension's extras, and `scope(prefix)` so the handles
 * it returns do too, at any depth. In a scope the path given to `fieldExtras` is relative to the scope.
 */
function extendHandles(handles: Handles, extension: FieldExtension): { field: unknown; scope?: unknown } {
  const { field, scope } = handles;
  if (typeof field !== 'function')
    throw new Error(`The "${extension.name}" extension adds field extras, so the form needs a field(path) api.`);

  return {
    field: (path: string) => {
      const handle = field(path) as object;
      return addMembers(handle, extension.fieldExtras(path, handle), extension.name);
    },
    scope:
      typeof scope === 'function'
        ? (prefix: string) => {
            const scoped = scope(prefix) as Handles;
            return { ...scoped, ...extendHandles(scoped, extension) };
          }
        : scope,
  };
}

/**
 * An extension adds api, slots and field extras. A slot with the key of a base slot replaces it. It cannot wrap it.
 * Field extras go on `field(path)` and on every scoped handle set (`scope(prefix).field(path)`).
 */
export const extendForm = ((definition: object, extension: ExtensionInput) => {
  const base = inputOf(definition);
  const name = extension.name ?? base.name;
  return register({
    name,
    options: { ...base.options, ...extension.options },
    api: ctx => {
      const baseApi = base.api(ctx);
      const merged: Record<string, unknown> = { ...baseApi, ...extension.api(ctx, baseApi) };
      if (extension.fieldExtras) {
        const extended = extendHandles(merged, { name, fieldExtras: extension.fieldExtras.bind(extension) });
        merged.field = extended.field;
        if (merged.scope !== undefined) merged.scope = extended.scope;
      }
      return merged;
    },
    slots:
      base.slots || extension.slots
        ? slot => {
            const baseSlots = base.slots?.(slot) ?? {};
            return { ...baseSlots, ...extension.slots?.(slot, baseSlots) };
          }
        : undefined,
  });
}) as unknown as typeof Api.extendForm;

/** Packages a behavior. Applying it to a definition is `extendForm` with the packaged input. */
export const defineExtension = ((input: ExtensionInput) => (definition: object) =>
  extendForm(definition as never, input as never)) as unknown as typeof Api.defineExtension;

/** A mounted fragment carries its own mount logic under this key (see `fragments.ts`). */
const MOUNT = Symbol.for('oxform.fragment.mount');
type Mountable = Record<symbol, (options: Record<string, unknown>, mountPath: string) => Record<string, unknown>>;

function createInstance(definition: object, options: Record<string, unknown>) {
  const [ctx, controls] = createContext(options);
  const instance = {
    ...inputOf(definition).api(ctx),
    id: String(options.id ?? ''),
    store: ctx.store,
    destroy: () => controls.destroy(),
  };
  controls.bindInstance(instance);
  return instance;
}

/**
 * Later options win: the instance's options over `configureForm`'s. The caller supplies `id`, as an adapter would.
 * Fragments are mounted into the merged options, so an instance can still override a mount's default values.
 */
export const configureForm = ((definition: object, configured: Record<string, unknown>) => {
  const { fragments = {}, ...rest } = configured;
  const create = (options: Record<string, unknown> = {}) => {
    let merged: Record<string, unknown> = { ...rest, ...options };
    for (const [mountPath, fragment] of Object.entries(fragments as Record<string, Mountable>))
      merged = fragment[MOUNT]!(merged, mountPath);
    return createInstance(definition, merged);
  };
  return Object.assign(create, { definition });
}) as unknown as typeof Api.configureForm;
