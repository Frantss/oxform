/** A string literal that only the module of one extension or slot group puts in a bundle. */
export const markers = {
  values: 'values',
  rootSlots: 'rootSlots',
} as const;

export type Marker = keyof typeof markers;

/** Each tier and the markers it must not contain. The full tier must contain every marker. */
export const tiers: Record<string, readonly Marker[]> = {
  'tier-values': ['rootSlots'],
  'tier-full': [],
};

export const fullTier = 'tier-full';

export const allowedImports = ['@oxform/core', '@oxform/core/behaviors', '@oxform/core/presets'];
