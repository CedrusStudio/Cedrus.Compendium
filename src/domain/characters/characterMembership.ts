/** IDs as returned by persistence, kept separately from editable relation data. */
export type CharacterMembershipSnapshot = {
  perksIds: string[];
  maneuversIds: string[];
  stancesIds: string[];
  statesIds: string[];
  spellsIds: string[];
  powerSpecificationsIds: string[];
};

export const membershipKinds = ['maneuvers', 'perks', 'stances', 'states'] as const;
export type MembershipKind = typeof membershipKinds[number];

export const membershipLimits: Record<MembershipKind, number> = {
  maneuvers: 100, perks: 500, stances: 20, states: 20,
};

export type MembershipResult = {
  characterId: string;
  kind: MembershipKind;
  entityId: string;
  present: boolean;
  changed: boolean;
};

export function membershipSnapshot(character: Partial<CharacterMembershipSnapshot>): CharacterMembershipSnapshot {
  return {
    perksIds: character.perksIds ?? [], maneuversIds: character.maneuversIds ?? [],
    stancesIds: character.stancesIds ?? [], statesIds: character.statesIds ?? [],
    spellsIds: character.spellsIds ?? [], powerSpecificationsIds: character.powerSpecificationsIds ?? [],
  };
}
