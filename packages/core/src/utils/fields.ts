import type { FormIssue } from '#types/api';
import type { PersistedFieldMeta } from '#types/internal';
import { buildPathsMap } from '#utils/build-paths-map';
import { generateId } from '#utils/generate-id';
import { getAscendantPaths } from '#utils/get-ascendant-paths';

type FieldEntry = {
  id: string;
  meta: PersistedFieldMeta;
  errors: FormIssue[];
  ref: HTMLElement | null;
};

export type PersistedFields = Record<string, FieldEntry>;

export const fields_root = '~root';

export const fields_fixPath = (path: string) => {
  if (path.startsWith(fields_root)) return path;

  return `${fields_root}.${path}`;
};

export const fields_build = (values: unknown): PersistedFields => {
  const build = () => {
    return {
      id: generateId(),
      meta: { blurred: false, dirty: false, touched: false },
      errors: [],
      ref: null,
    } satisfies FieldEntry;
  };

  return {
    [fields_root]: build(),
    ...buildPathsMap(values, build, fields_root),
  } satisfies PersistedFields;
};

export type FieldSetOptions = {
  meta?: Partial<PersistedFieldMeta>;
  errors?: FormIssue[];
  ref?: HTMLElement | null;
};

export const fields_set = (fields: PersistedFields, path: string, field: FieldSetOptions): PersistedFields => {
  const fixed = fields_fixPath(path);
  const paths = getAscendantPaths(fixed);
  const updated = paths.reduce((acc, curr) => {
    const entry = fields[curr];
    const target = curr === fixed;
    const errors = target ? (field.errors ?? entry.errors) : entry.errors;
    const ref = target ? (field.ref !== undefined ? field.ref : entry.ref) : entry.ref;

    return {
      ...acc,
      [curr]: {
        ...entry,
        errors,
        ref,
        meta: {
          dirty: field.meta?.dirty ?? entry.meta.dirty,
          touched: field.meta?.touched ?? entry.meta.touched,
          blurred: field.meta?.blurred ?? entry.meta.blurred,
        },
      },
    };
  }, {});

  return {
    ...fields,
    ...updated,
  };
};

export const fields_delete = (fields: PersistedFields, path: string): PersistedFields => {
  const fixed = fields_fixPath(path);

  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => {
      return !key.includes(fixed);
    }),
  );
};

export const fields_reset = (fields: PersistedFields, path: string, values: unknown): PersistedFields => {
  const deleted = fields_delete(fields, path);
  const updated = fields_build(values);

  return {
    ...updated,
    ...deleted,
  };
};

export const fields_shift = (
  fields: PersistedFields,
  path: string,
  position: number,
  direction: 'left' | 'right',
): PersistedFields => {
  const fixed = fields_fixPath(path);
  let index = position;
  const left = direction === 'left';
  const swap = left ? -1 : 1;
  let next = undefined;

  const updated = { ...fields };

  while (true) {
    const from = `${fixed}.${index}`;
    const to = `${fixed}.${index + swap}`;
    const future = fields[to];
    const shouldBreak = left ? index === 1 || !updated[from] : !future;

    updated[to] = left ? updated[from] : (next ?? updated[from]);
    if (left || index === position) delete updated[from];

    if (shouldBreak) break;

    next = future;
    index = index + 1;
  }

  return updated;
};

export const fields_swap = (fields: PersistedFields, path: string, from: number, to: number): PersistedFields => {
  const fixed = fields_fixPath(path);
  const fromPath = `${fixed}.${from}`;
  const toPath = `${fixed}.${to}`;
  const fromEntry = fields[fromPath];
  const toEntry = fields[toPath];
  const updated = { ...fields };

  if (toEntry) updated[fromPath] = toEntry;
  else delete updated[fromPath];

  if (fromEntry) updated[toPath] = fromEntry;
  else delete updated[toPath];

  return updated;
};

export const fields_move = (fields: PersistedFields, path: string, from: number, to: number): PersistedFields => {
  const fixed = fields_fixPath(path);
  const updated = { ...fields };

  if (from === to) return updated;

  const sourcePath = `${fixed}.${from}`;
  const sourceEntry = fields[sourcePath];
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const backwards = from > to;

  const setOrDelete = (targetPath: string, entry: FieldEntry | undefined) => {
    if (entry) updated[targetPath] = entry;
    else delete updated[targetPath];
  };

  setOrDelete(`${fixed}.${to}`, sourceEntry);

  if (backwards) {
    for (let i = start + 1; i <= end; i++) {
      setOrDelete(`${fixed}.${i}`, fields[`${fixed}.${i - 1}`]);
    }
  } else {
    for (let i = start; i < end; i++) {
      setOrDelete(`${fixed}.${i}`, fields[`${fixed}.${i + 1}`]);
    }
  }

  return updated;
};

export const fields_remove = (fields: PersistedFields, path: string, index: number): PersistedFields => {
  const fixed = fields_fixPath(path);
  const updated = { ...fields };
  let position = index;

  while (true) {
    const currentPath = `${fixed}.${position}`;
    const nextPath = `${fixed}.${position + 1}`;
    const nextEntry = fields[nextPath];

    if (nextEntry) updated[currentPath] = nextEntry;
    else {
      delete updated[currentPath];
      break;
    }

    position = position + 1;
  }

  return updated;
};
