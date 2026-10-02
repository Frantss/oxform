import { DEFAULT_FIELD_STATUS } from '#constants';
import type { FormOptions } from '#types/api/form-options';
import { checksEngine_issueLevels } from '#utils/checks-issues-engine';
import { issues_empty, issues_normalize } from '#utils/issues';
import { buildPathsMap } from '#utils/build-paths-map';
import type { FieldEntry } from '#utils/fields/field-entry';
import type { FieldSetOptions } from '#utils/fields/field-set-options';
import type { PersistedFields } from '#utils/fields/persisted-fields';
import { generateId } from '#utils/generate-id';
import { getAscendantPaths } from '#utils/get-ascendant-paths';

export type { FieldEntry } from '#utils/fields/field-entry';
export type { FieldSetOptions } from '#utils/fields/field-set-options';
export type { PersistedFields } from '#utils/fields/persisted-fields';

export const fields_root = '~root';

export const fields_pathWithRoot = (path: string) => {
  if (path.startsWith(fields_root)) return path;

  return `${fields_root}.${path}`;
};

export const fields_pathWithoutRoot = (path: string) => {
  const [, fixed] = path.split(`${fields_root}.`);

  return fixed;
};

export const fields_build = <Level extends string = string>(
  options: FormOptions<any, Level>,
  values: unknown = options.defaultValues,
): PersistedFields<Level> => {
  const issueLevels = checksEngine_issueLevels(options);

  const build = (path: string) => {
    return {
      id: generateId(),
      status: {
        ...DEFAULT_FIELD_STATUS,
        ...options?.defaultFieldStatus?.['*'],
        ...options?.defaultFieldStatus?.[fields_pathWithoutRoot(path)],
      },
      issues: issues_empty(issueLevels),
      ref: null,
    } satisfies FieldEntry<Level>;
  };

  return {
    [fields_root]: build(fields_root),
    ...buildPathsMap(values, build, fields_root),
  } satisfies PersistedFields<Level>;
};

export const fields_set = <Level extends string = string>(
  fields: PersistedFields<Level>,
  path: string,
  field: FieldSetOptions<Level>,
  options?: Pick<FormOptions<any, Level>, 'checks'>,
): PersistedFields<Level> => {
  const fixed = fields_pathWithRoot(path);
  const paths = getAscendantPaths(fixed);
  const issueLevels = checksEngine_issueLevels(options ?? {});
  const updated = paths.reduce((acc, curr) => {
    const entry = fields[curr];
    const target = curr === fixed;
    const issues = target && field.issues !== undefined ? issues_normalize(field.issues, issueLevels) : entry.issues;
    const ref = target ? (field.ref !== undefined ? field.ref : entry.ref) : entry.ref;

    return {
      ...acc,
      [curr]: {
        ...entry,
        issues,
        ref,
        status: {
          dirty: field.status?.dirty ?? entry.status.dirty,
          touched: field.status?.touched ?? entry.status.touched,
          blurred: field.status?.blurred ?? entry.status.blurred,
        },
      },
    };
  }, {});

  return {
    ...fields,
    ...updated,
  };
};

export const fields_delete = <Level extends string = string>(
  fields: PersistedFields<Level>,
  path: string,
): PersistedFields<Level> => {
  const fixed = fields_pathWithRoot(path);

  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => {
      return !key.includes(fixed);
    }),
  );
};

export const fields_reset = (
  fields: PersistedFields<any>,
  path: string,
  options: FormOptions<any, any>,
  values: unknown = options.defaultValues,
): PersistedFields<any> => {
  const deleted = fields_delete(fields, path);
  const updated = fields_build(options, values);

  return {
    ...updated,
    ...deleted,
  };
};

const fields_remapArrayIndices = (
  fields: PersistedFields<any>,
  path: string,
  remap: (index: number) => number | undefined,
): PersistedFields<any> => {
  const prefix = `${fields_pathWithRoot(path)}.`;

  return Object.fromEntries(
    Object.entries(fields).flatMap(([fieldPath, entry]) => {
      if (!fieldPath.startsWith(prefix)) return [[fieldPath, entry]];

      const suffix = fieldPath.slice(prefix.length);
      const [segment] = suffix.split('.');
      if (!/^\d+$/.test(segment)) return [[fieldPath, entry]];

      const index = remap(Number(segment));
      if (index === undefined) return [];

      return [[`${prefix}${index}${suffix.slice(segment.length)}`, entry]];
    }),
  );
};

export const fields_shift = (
  fields: PersistedFields<any>,
  path: string,
  position: number,
  direction: 'left' | 'right',
): PersistedFields<any> => {
  return fields_remapArrayIndices(fields, path, index => {
    if (direction === 'right') return index >= position ? index + 1 : index;
    if (index === position - 1) return undefined;
    return index >= position ? index - 1 : index;
  });
};

export const fields_swap = (
  fields: PersistedFields<any>,
  path: string,
  from: number,
  to: number,
): PersistedFields<any> => {
  return fields_remapArrayIndices(fields, path, index => (index === from ? to : index === to ? from : index));
};

export const fields_move = (
  fields: PersistedFields<any>,
  path: string,
  from: number,
  to: number,
): PersistedFields<any> => {
  return fields_remapArrayIndices(fields, path, index => {
    if (index === from) return to;
    if (from < to && index > from && index <= to) return index - 1;
    if (from > to && index >= to && index < from) return index + 1;
    return index;
  });
};

export const fields_remove = (fields: PersistedFields<any>, path: string, index: number): PersistedFields<any> => {
  return fields_remapArrayIndices(fields, path, current => {
    if (current === index) return undefined;
    return current > index ? current - 1 : current;
  });
};
