/**
 * Heuristic value of a maneuver's effects for the `valuePolicy` — the piece that
 * lets a policy credit non-damage effects (buffs, debuffs, control, heal), so
 * defensive maneuvers and defensive REACTIONS actually get chosen.
 *
 * All values are in "expected damage" units so they compare directly with a
 * plain attack:
 *   - damage            → its expected damage.
 *   - heal              → expected heal, capped at the caster's missing hp.
 *   - control           → opponent's expected attack × weight × duration
 *                         (value of denying the opponent actions).
 *   - status (DoT)      → tick × duration; (non-DoT, e.g. stagger) → partial denial.
 *   - buff (self)       → extra expected damage from the offense buff + damage
 *                         prevented by the defense buff, × duration.
 *   - debuff (opponent) → opponent damage prevented + our extra damage, × duration.
 * Heuristic and deterministic — good enough to make sensible, explainable choices.
 */

import type { Effect } from "@/domain/combat-lab/effects/Effect";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import { selectDefaultOffense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { applyOffenseBuff } from "@/domain/characters/buffs/applyBuffProfile";
import { expectedOffenseDamage, expectedDamageSpec } from "@/domain/combat-lab/engine/ai/expectedDamage";

const CONTROL_WEIGHT: Record<string, number> = { stun: 1, disarm: 0.8, silence: 0.5, root: 0.2 };

export function expectedManeuverValue(self: CombatantRuntime, opponent: CombatantRuntime, effects: Effect[]): number
{
  const oppRaw = rawDamageOf(opponent);
  const selfRaw = rawDamageOf(self);
  let total = 0;
  for (const effect of effects)
  {
    total += effectValue(self, opponent, effect, oppRaw, selfRaw);
  }
  return total;
}

function effectValue(self: CombatantRuntime, opponent: CombatantRuntime, effect: Effect, oppRaw: number, selfRaw: number): number
{
  switch (effect.type)
  {
    case "damage":
      return expectedDamageSpec(effect.damage);
    case "heal":
    {
      const missing = Math.max(0, self.snapshot.maxHp - self.currentHp);
      return Math.min(expectedDamageSpec(effect.amount), missing);
    }
    case "status":
      if (effect.tick) return expectedDamageSpec(effect.tick.damage) * Math.max(1, effect.duration);
      return oppRaw * 0.3 * Math.max(1, effect.duration);
    case "control":
      return oppRaw * (CONTROL_WEIGHT[effect.control] ?? 0.2) * Math.max(1, effect.duration);
    case "buff":
      return selfBuffValue(self, effect.profile.profileId, effect.duration, oppRaw);
    case "debuff":
      return debuffValue(self, opponent, effect.profile.profileId, effect.duration, selfRaw);
    case "chance":
      return (effect.chance / 100) * expectedManeuverValue(self, opponent, effect.then);
    default:
      return 0; // push / pull / resource — no value model yet
  }
}

function rawDamageOf(runtime: CombatantRuntime): number
{
  const offense = selectDefaultOffense(runtime.snapshot);
  return offense ? expectedOffenseDamage(offense) : 0;
}

function findProfile(runtime: CombatantRuntime, profileId: string): BuffProfile | undefined
{
  return runtime.snapshot.buffProfiles.find(p => p.id === profileId);
}

/** Signed sum of a profile's flat defensive layers (positive = stronger). */
function signedDefenseSum(profile: BuffProfile): number
{
  const d = profile.defense;
  return d.block + d.parry + d.dodge + d.protection + d.resistance + d.bonus;
}

function selfBuffValue(self: CombatantRuntime, profileId: string, duration: number, oppRaw: number): number
{
  const profile = findProfile(self, profileId);
  if (!profile) return 0;

  const offense = selectDefaultOffense(self.snapshot);
  const offenseGain = offense ? expectedOffenseDamage(applyOffenseBuff(offense, profile)) - expectedOffenseDamage(offense) : 0;
  const defenseValue = Math.min(Math.max(0, signedDefenseSum(profile)), oppRaw);

  return Math.max(0, offenseGain + defenseValue) * Math.max(1, duration);
}

function debuffValue(self: CombatantRuntime, opponent: CombatantRuntime, profileId: string, duration: number, selfRaw: number): number
{
  const profile = findProfile(self, profileId);
  if (!profile) return 0;

  const oppOffense = selectDefaultOffense(opponent.snapshot);
  const offenseLoss = oppOffense ? expectedOffenseDamage(oppOffense) - expectedOffenseDamage(applyOffenseBuff(oppOffense, profile)) : 0;
  // A debuff lowers the opponent's defense (negative sum) → we deal more.
  const defenseWeaken = Math.min(Math.max(0, -signedDefenseSum(profile)), selfRaw);

  return Math.max(0, offenseLoss + defenseWeaken) * Math.max(1, duration);
}
