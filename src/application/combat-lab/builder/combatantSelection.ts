/**
 * A picked combatant for a simulation: which character, how it attacks, and
 * which of its buff profiles are active FOR THIS RUN (per-simulation buffs,
 * point 6 — independent of what's toggled on the saved character).
 */

import type { Character } from "@/domain/characters/Character";
import type { CombatantSnapshot, AttackKind } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { toCombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";

export type CombatantSelection =
{
  characterId: string;
  characterName: string;
  attackKind: AttackKind;
  /** Buff-profile ids active for this simulation (overrides the character's own). */
  activeBuffProfileIds: string[];
};

export function createSelection(characterId: string, characterName: string): CombatantSelection
{
  return { characterId, characterName, attackKind: "melee", activeBuffProfileIds: [] };
}

/** Build the engine snapshot for a selection from its loaded character. */
export function buildSnapshotFromSelection(character: Character, selection: CombatantSelection): CombatantSnapshot
{
  return toCombatantSnapshot(character, {
    attackKind: selection.attackKind,
    overrideActiveBuffProfileIds: selection.activeBuffProfileIds,
  });
}
