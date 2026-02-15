import type { FormIssue, PersistedFieldMeta } from '#form-api.types';
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

const fields_fixPath = (path: string) => {
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

    return {
      ...acc,
      [curr]: {
        ...entry,
        ...field,
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

export const fields_swap = (
  fields: PersistedFields,
  from: number,
  to: number,
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
