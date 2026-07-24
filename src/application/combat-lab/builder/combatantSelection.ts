/**
 * A picked combatant for a simulation: which character, how it attacks, and
 * which of its buff profiles are active FOR THIS RUN (per-simulation buffs,
 * point 6 — independent of what's toggled on the saved character).
 */

import type { Character } from "@/domain/characters/Character";
import type { CombatantSnapshot, AttackKind, SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { toCombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { PowerSpecification } from "@/domain/characters/combat/Power";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { createDefaultBuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { ulid } from "ulid";

export type CombatantSelection =
{
  characterId: string;
  characterName: string;
  attackKind: AttackKind;
  /** Which offense profile to lead with (defaults to the character's default). */
  offenseId?: string;
  /** Which defense profile to guard with (defaults to the character's default). */
  defenseId?: string;
  /** Buff-profile ids active for this simulation (overrides the character's own). */
  activeBuffProfileIds: string[];
  /** Ad-hoc, simulation-only buff profiles layered on top. */
  extraBuffProfiles: BuffProfile[];
  /** Starting resource pools (mana/essence) for this run. */
  startingResources?: { mana?: number; essence?: number };
  /** PowerSpecifications (by id) loaded separately, needed to resolve castable spells. */
  powerSpecifications?: Record<string, PowerSpecification>;
  /** Which PowerOffense (index) each power uses for its spells (defaults to 0). */
  spellOffenseSelection?: Record<string, number>;
  /** Starting stance/state for this run (chosen from the library in the picker). */
  stance?: SnapshotMode;
  state?: SnapshotMode;
};

export function createSelection(characterId: string, characterName: string): CombatantSelection
{
  return { characterId, characterName, attackKind: "melee", activeBuffProfileIds: [], extraBuffProfiles: [] };
}

/**
 * Build the engine snapshot for a selection from its loaded character. When the
 * selection picks a specific offense/defense, we override the snapshot's default
 * ids so the engine's `selectDefault*` naturally leads with the chosen profile —
 * no change to the hot loop.
 */
export function buildSnapshotFromSelection(character: Character, selection: CombatantSelection): CombatantSnapshot
{
  const snapshot = toCombatantSnapshot(character, {
    attackKind: selection.attackKind,
    overrideActiveBuffProfileIds: selection.activeBuffProfileIds,
    extraBuffProfiles: selection.extraBuffProfiles,
    startingResources: selection.startingResources,
    powerSpecifications: selection.powerSpecifications,
    spellOffenseSelection: selection.spellOffenseSelection,
    stance: selection.stance,
    state: selection.state,
  });

  return {
    ...snapshot,
    defaultOffenseId: selection.offenseId && snapshot.offenses.some(o => o.id === selection.offenseId)
      ? selection.offenseId
      : snapshot.defaultOffenseId,
    defaultDefenseId: selection.defenseId && snapshot.defenses.some(d => d.id === selection.defenseId)
      ? selection.defenseId
      : snapshot.defaultDefenseId,
  };
}

/**
 * Ad-hoc temporary buff kinds offered in the picker. Only fields that actually
 * affect the engine are exposed: offense (damage / dice / crit), defense layers,
 * and precyzja/refleks (ranged to-hit). Characteristics are omitted because the
 * snapshot's offense is pre-baked and wouldn't change from them.
 */
export type TempBuffKind =
  | "damage" | "diceGrade" | "critPower"
  | "block" | "parry" | "dodge" | "protection" | "resistance" | "immunity"
  | "precision" | "reflex";

export const TEMP_BUFF_LABELS: Record<TempBuffKind, string> = {
  damage: "Obrażenia (płaskie)",
  diceGrade: "Ranga kości broni",
  critPower: "Siła krytyka",
  block: "Blokowanie",
  parry: "Parowanie",
  dodge: "Unik",
  protection: "Pancerz",
  resistance: "Odporność",
  immunity: "Niewrażliwość (usuwa kości)",
  precision: "Precyzja",
  reflex: "Refleks",
};

/** Build a one-field temporary buff profile with a readable name. */
export function createTempBuff(kind: TempBuffKind, value: number): BuffProfile
{
  const base = structuredClone(createDefaultBuffProfile()) as BuffProfile;
  const profile: BuffProfile = { ...base, id: ulid(), name: `${TEMP_BUFF_LABELS[kind]} ${value >= 0 ? "+" : ""}${value}` };

  switch (kind)
  {
    case "damage": profile.offense.damageBonus.bonus = value; break;
    case "diceGrade": profile.offense.leadingWeapon.grade = value; break;
    case "critPower": profile.offense.leadingWeapon.criticalPower = value; break;
    case "block": profile.defense.block = value; break;
    case "parry": profile.defense.parry = value; break;
    case "dodge": profile.defense.dodge = value; break;
    case "protection": profile.defense.protection = value; break;
    case "resistance": profile.defense.resistance = value; break;
    case "immunity": profile.defense.immunity = value; break;
    case "precision": profile.attributes.precision.value = value; break;
    case "reflex": profile.attributes.reflex.value = value; break;
  }
  return profile;
}
