export type Item = 
{
  readonly id: string;
  name: string;
  description: string;
};

export type DefensiveItem = Item &
{
  resistance: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export const allowedItemAttributePenalties = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const satisfies readonly number[];
export const allowedDexterityRestrictions = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const satisfies readonly number[];
export const allowedInitiativeRestrictions = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const satisfies readonly number[];
export const allowedStrengthRequirements = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const satisfies readonly number[];