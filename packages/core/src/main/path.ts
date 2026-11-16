import { getAt } from '#internal/paths';
import type { Path, PathValue } from './path-types';

/** Reads a path from plain values, for example from the state in a slot. */
export const get = <Values, const At extends Path<Values>>(values: Values, at: At): PathValue<Values, At> =>
  getAt(values, at) as PathValue<Values, At>;

/**
 * Makes a path safe for an element id. Letters and digits stay, a dot becomes `-`, and any other character
 * becomes `_<code point in hex>_`. Two different paths never give the same id part.
 */
export const idPart = (path: string): string =>
  path.replace(/[^A-Za-z0-9]/gu, character =>
    character === '.' ? '-' : `_${character.codePointAt(0)!.toString(16)}_`,
  );
