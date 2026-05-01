export const bestiaryColumnPreferenceKeys = [
  'tags',
  'initiative',
  'health',
  'defense',
  'offense',
  'powers',
  'characteristics',
  'attributes',
] as const;

export type BestiaryColumnPreferenceKey = typeof bestiaryColumnPreferenceKeys[number];

export const defaultBestiaryColumnVisibility: Record<BestiaryColumnPreferenceKey, boolean> = {
  tags: false,
  initiative: true,
  health: true,
  defense: true,
  offense: true,
  powers: false,
  characteristics: false,
  attributes: false,
};

export const resolveBestiaryColumnVisibility = (
  savedVisibility?: Partial<Record<BestiaryColumnPreferenceKey, boolean>>,
): Record<BestiaryColumnPreferenceKey, boolean> => {
  if (!savedVisibility) return { ...defaultBestiaryColumnVisibility };

  const sanitizedVisibility = Object.fromEntries(
    Object.entries(savedVisibility).filter(
      ([key, value]) => bestiaryColumnPreferenceKeys.includes(key as BestiaryColumnPreferenceKey) && typeof value === 'boolean',
    ),
  ) as Partial<Record<BestiaryColumnPreferenceKey, boolean>>;

  return {
    ...defaultBestiaryColumnVisibility,
    ...sanitizedVisibility,
  };
};