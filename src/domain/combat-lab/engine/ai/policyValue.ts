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
import { activeBuffProfiles, type CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import { effectiveSkills } from "@/domain/combat-lab/engine/buffs";
import { selectDefaultOffense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { applyOffenseBuff } from "@/domain/characters/buffs/applyBuffProfile";
import { expectedOffenseDamage, expectedDamageSpec } from "@/domain/combat-lab/engine/ai/expectedDamage";
import { statEffectToProfile } from "@/domain/combat-lab/effects/statBuff";
import { expectedSideResult } from "@/domain/combat-lab/engine/resolveContestedTest";
import { countScaleSource, scaleTimes } from "@/domain/combat-lab/engine/scaleSource";
import { getEffectPlugin } from "@/domain/combat-lab/plugins/registry";

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
    case "stat":
    {
      const profile = statEffectToProfile(effect);
      return effect.mode === "self"
        ? selfBuffValueFromProfile(self, profile, effect.duration, oppRaw)
        : debuffValueFromProfile(opponent, profile, effect.duration, selfRaw);
    }
    case "roll":
    {
      if (effect.modifier === "extraDie") return ((effect.grade ?? 3) * 2 + 1) / 2; // expected value of one added die
      // advantage ≈ a modest boost to our own expected damage; disadvantage is a
      // self-penalty we would never choose → no positive value.
      return effect.modifier === "advantage" ? selfRaw * 0.2 : 0;
    }
    case "contested":
    {
      // Estimate win probability from the expected margin, then credit the
      // value of the onWin effects. Heuristic (no rolling): a +/-20 spread maps
      // roughly to certain win/loss.
      // Te same liczby, co potem w `resolveContestedTest` — inaczej AI wybiera
      // manewr na podstawie wartości sprzed buffów, a rzut idzie po innych.
      const margin = expectedSideResult(effectiveSkills(self.snapshot.skills, activeBuffProfiles(self)), effect.attacker)
        - expectedSideResult(effectiveSkills(opponent.snapshot.skills, activeBuffProfiles(opponent)), effect.defender);
      const pWin = Math.max(0, Math.min(1, 0.5 + margin / 20));
      return pWin * expectedManeuverValue(self, opponent, effect.onWin);
    }
    case "save":
    {
      // The target (default) saves vs a fixed ST; the more likely it fails, the
      // more the onFail effects (usually damage to the opponent) are worth.
      const saver = effect.who === "self" ? self : opponent;
      const expRoll = expectedSideResult(effectiveSkills(saver.snapshot.skills, activeBuffProfiles(saver)), effect.pool);
      const pFail = Math.max(0, Math.min(1, 0.5 + (effect.st - expRoll) / 20));
      return pFail * expectedManeuverValue(self, opponent, effect.onFail);
    }
    case "when":
      // We can't know statically whether the condition will hold; discount the
      // nested value to reflect conditionality (better than treating it as free).
      return 0.5 * expectedManeuverValue(self, opponent, effect.then);
    case "scale":
    {
      const times = scaleTimes(countScaleSource(effect.source, self, opponent), effect.per, effect.cap);
      return times * expectedManeuverValue(self, opponent, [effect.effect]);
    }
    case "multiplier":
    {
      const dur = Math.max(1, effect.duration);
      const delta = effect.factor - 1; // >0 amplify, <0 reduce
      if (effect.target === "damageDealt")
      {
        // Scales the DEALER's output: my output up = good; opponent's output down = good.
        return effect.mode === "self" ? selfRaw * delta * dur : oppRaw * -delta * dur;
      }
      // damageTaken scales the TAKER's incoming: me taking less = good; opponent taking more = good.
      return effect.mode === "self" ? oppRaw * -delta * dur : selfRaw * delta * dur;
    }
    case "chance":
      return (effect.chance / 100) * expectedManeuverValue(self, opponent, effect.then);
    case "custom":
      return getEffectPlugin(effect.effectType)?.expectedValue?.(effect, self, opponent) ?? 0;
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
  return profile ? selfBuffValueFromProfile(self, profile, duration, oppRaw) : 0;
}

function selfBuffValueFromProfile(self: CombatantRuntime, profile: BuffProfile, duration: number, oppRaw: number): number
{
  const offense = selectDefaultOffense(self.snapshot);
  const offenseGain = offense ? expectedOffenseDamage(applyOffenseBuff(offense, profile)) - expectedOffenseDamage(offense) : 0;
  const defenseValue = Math.min(Math.max(0, signedDefenseSum(profile)), oppRaw);

  return Math.max(0, offenseGain + defenseValue) * Math.max(1, duration);
}

function debuffValue(self: CombatantRuntime, opponent: CombatantRuntime, profileId: string, duration: number, selfRaw: number): number
{
  const profile = findProfile(self, profileId);
  return profile ? debuffValueFromProfile(opponent, profile, duration, selfRaw) : 0;
}

function debuffValueFromProfile(opponent: CombatantRuntime, profile: BuffProfile, duration: number, selfRaw: number): number
{
  const oppOffense = selectDefaultOffense(opponent.snapshot);
  const offenseLoss = oppOffense ? expectedOffenseDamage(oppOffense) - expectedOffenseDamage(applyOffenseBuff(oppOffense, profile)) : 0;
  // A debuff lowers the opponent's defense (negative sum) → we deal more.
  const defenseWeaken = Math.min(Math.max(0, -signedDefenseSum(profile)), selfRaw);

  return Math.max(0, offenseLoss + defenseWeaken) * Math.max(1, duration);
}
