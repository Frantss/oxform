/** Values that a path does not enter. `Blob` covers `File`. */
type Leaf =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | Blob
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>
  | ((...parameters: never) => unknown);

type Join<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`;

type Entry<EntryPath extends string = string, Value = unknown> = { path: EntryPath; value: Value };

/** The deepest path that the types follow. Below it, every path is accepted with an `unknown` value. */
type MaximumDepth = 10;

type ChildEntries<Child, ChildPath extends string, Missing, Depth extends unknown[]> =
  | Entry<ChildPath, Child | Missing>
  | EntriesOf<NonNullable<Child>, ChildPath, Missing | Extract<Child, null | undefined>, [...Depth, unknown]>;

/** Each path below a value and the value at that path. A missing ancestor adds `undefined` or `null`. */
type EntriesOf<Value, Prefix extends string, Missing, Depth extends unknown[]> = Depth['length'] extends MaximumDepth
  ? Entry<Join<Prefix, string>>
  : unknown extends Value
    ? Entry<Join<Prefix, string>>
    : Value extends Leaf
      ? never
      : Value extends readonly unknown[]
        ? number extends Value['length']
          ? ChildEntries<Value[number], Join<Prefix, `${number}`>, Missing | undefined, Depth>
          : {
              [Key in keyof Value & `${number}`]: ChildEntries<Value[Key], Join<Prefix, Key>, Missing, Depth>;
            }[keyof Value & `${number}`]
        : {
            [Key in keyof Value & (string | number)]-?: ChildEntries<
              Value[Key],
              Join<Prefix, `${Key}`>,
              Missing,
              Depth
            >;
          }[keyof Value & (string | number)];

type Entries<Values> = EntriesOf<Values, '', never, []>;

type EntryAt<Values, At extends string> =
  Entries<Values> extends infer Found
    ? Found extends Entry
      ? At extends Found['path']
        ? Found
        : never
      : never
    : never;

/** Every dotted path into the values. An array index is a number key, for example `tags.0`. */
export type Path<Values> = Entries<Values>['path'];

/** The value at a path. It includes `undefined` when an array item or an optional ancestor can be missing. */
export type PathValue<Values, At extends string> = EntryAt<Values, At>['value'];

/** The paths that hold an object, an array, `null` or `undefined`. */
export type ObjectPath<Values> = Extract<Entries<Values>, Entry<string, object | null | undefined>>['path'];

/** The paths that hold an array, `null` or `undefined`. */
export type ArrayPath<Values> = Extract<Entries<Values>, Entry<string, readonly unknown[] | null | undefined>>['path'];

/** The array at a path, without `null` and `undefined`. */
export type ArrayValue<Values, At extends string> = Extract<NonNullable<PathValue<Values, At>>, readonly unknown[]>;

/** The item type of the array at a path. */
export type ArrayItem<Values, At extends string> = ArrayValue<Values, At>[number];

export type Updater<Value> = Value | ((current: Value) => Value);

export type MaybePromise<Value> = Value | Promise<Value>;

export type Unsubscribe = () => void;

export type DeepPartial<Value> = Value extends Leaf ? Value : { [Key in keyof Value]?: DeepPartial<Value[Key]> };
