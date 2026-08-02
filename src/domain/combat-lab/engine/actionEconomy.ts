/**
 * Thin adapter over the EXISTING action economy in characters/Castable.ts.
 * The engine does not reinvent action points — it asks `canUseCastable` which
 * maneuvers still fit the turn (respecting cast-time combination profiles,
 * once-per-turn, and cooldowns), and records used castables in the same
 * `(Castable | "end")[]` shape that function expects.
 */

import { canUseCastable } from "@/domain/characters/Castable";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { SnapshotMode, SnapshotSpell } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import { isStaggered } from "@/domain/combat-lab/engine/CombatState";

export type Action =
  | { kind: "attack" }
  | { kind: "ranged" }
  | { kind: "maneuver"; maneuver: ManeuverDefinition }
  | { kind: "spell"; spell: SnapshotSpell }
  /**
   * Switching stance. A MOVE-like action per the rulebook: it costs neither the
   * attack nor the maneuver budget, so it goes nowhere near `canUseCastable`.
   * Its only limits are the timing rule in `runCombat` (once per turn, before
   * the attack XOR after it) and having somewhere to switch to.
   */
  | { kind: "stanceChange"; stance: SnapshotMode }
  | { kind: "pass" };

/**
 * A maneuver is REACTIVE if it's an instant/over-instant cast time
 * (Natychmiastowa / Nadnatychmiastowa) — the rulebook allows those in response
 * to an opponent's attack, so they are NOT spent proactively in one's own turn.
 * Standardowa / Pełnorundowa maneuvers are proactive.
 */
export function isReactiveManeuver(maneuver: ManeuverDefinition): boolean
{
  return maneuver.castTime === "Natychmiastowa" || maneuver.castTime === "Nadnatychmiastowa";
}

/**
 * Proactive maneuvers usable right now (Standardowa / Pełnorundowa), governed by
 * `canUseCastable`. Used in the pre-attack phase of a turn — a maneuver may buff
 * or add damage BEFORE the attack, so maneuvers resolve first. Reactive
 * (instant) maneuvers are excluded here; they are reserved for responses.
 */
export function availableProactiveManeuvers(runtime: CombatantRuntime): Action[]
{
  if (isStaggered(runtime)) return [];

  const actions: Action[] = [];
  for (const maneuver of runtime.snapshot.maneuvers)
  {
    if (!isReactiveManeuver(maneuver) && canUseCastable(maneuver, runtime.usedCastables) && !isTagForbidden(runtime, maneuver.tags, "maneuvers"))
    {
      actions.push({ kind: "maneuver", maneuver });
    }
  }
  return actions;
}

/**
 * Whether a tag ban currently blocks something carrying `tags`.
 *
 * Comparison is case-insensitive and trimmed, because the ban text comes from a
 * description ("defensywne") while the tags come from the library's own tag
 * list — the two are authored by hand, at different times.
 */
export function isTagForbidden(runtime: CombatantRuntime, tags: string[] | undefined, scope: "maneuvers" | "stances"): boolean
{
  if (!tags || tags.length === 0 || runtime.forbiddenTags.length === 0) return false;

  const owned = new Set(tags.map(tag => tag.trim().toLowerCase()));

  return runtime.forbiddenTags.some(ban =>
    (ban.scope === "all" || ban.scope === scope) && owned.has(ban.tag.trim().toLowerCase()));
}

/**
 * Reactive maneuvers usable right now (Natychmiastowa / Nadnatychmiastowa),
 * governed by `canUseCastable` (cooldown, once-per-turn, cast-time profile).
 * These are the maneuvers a combatant may use in RESPONSE to an opponent's
 * attack (see the reaction hook in runCombat). A staggered combatant can't.
 */
export function availableReactiveManeuvers(runtime: CombatantRuntime): Action[]
{
  if (isStaggered(runtime)) return [];

  const actions: Action[] = [];
  for (const maneuver of runtime.snapshot.maneuvers)
  {
    if (isReactiveManeuver(maneuver) && canUseCastable(maneuver, runtime.usedCastables) && !isTagForbidden(runtime, maneuver.tags, "maneuvers"))
    {
      actions.push({ kind: "maneuver", maneuver });
    }
  }
  return actions;
}

/**
 * Castable damage spells available right now. A spell is cast INSTEAD of the
 * basic attack (rulebook: it occupies the attack action), so it's only offered
 * when the attack hasn't been spent. Gated by essence cost and per-spell
 * cooldown. Essence does not regenerate, so the pool only shrinks.
 */
export function availableSpells(runtime: CombatantRuntime): Action[]
{
  if (runtime.attackedThisTurn) return [];

  const actions: Action[] = [];
  for (const spell of runtime.snapshot.spells)
  {
    const onCooldown = (runtime.spellCooldowns[spell.id] ?? 0) > 0;
    if (!onCooldown && runtime.resources.essence >= spell.costEssence)
    {
      actions.push({ kind: "spell", spell });
    }
  }
  return actions;
}

/**
 * Stances this combatant could switch INTO right now — its authored repertoire
 * minus whatever it is already standing in. Empty unless the run was set up with
 * more than one stance, which is the honest default: a fighter who brought a
 * single stance has nothing to change to.
 *
 * The timing rule (once per turn, before the attack XOR after it) is NOT checked
 * here — `runCombat` owns it, because only the turn knows which window it is in.
 * A staggered combatant cannot move, so it cannot change stance either.
 */
export function availableStanceChanges(runtime: CombatantRuntime): Action[]
{
  if (isStaggered(runtime)) return [];

  const repertoire = runtime.snapshot.stanceOptions ?? [];
  const current = runtime.activeStance?.mode.name;

  return repertoire
    .filter((stance) => stance.name !== current && !isTagForbidden(runtime, stance.tags, "stances"))
    .map((stance): Action => ({ kind: "stanceChange", stance }));
}

/**
 * Every action the combatant may legally take right now (excluding "pass").
 *
 * The basic attack is a SEPARATE action from maneuvers (rulebook): it is granted
 * once per turn independently of `canUseCastable`, so a combatant can attack AND
 * spend its full maneuver budget in the same turn. Maneuvers alone are governed
 * by `canUseCastable` against `usedCastables` (which no longer contains the
 * attack). Movement is a third independent action, not yet modelled in 1v1.
 */
export function availableActions(runtime: CombatantRuntime): Action[]
{
  const actions: Action[] = [];

  if (!runtime.attackedThisTurn)
  {
    // Basic attack is melee or ranged depending on the combatant's attackKind.
    actions.push(runtime.snapshot.attackKind === "melee" ? { kind: "attack" } : { kind: "ranged" });
  }

  // Oszołomienie blocks all maneuvers — only the basic attack remains.
  if (!isStaggered(runtime))
  {
    for (const maneuver of runtime.snapshot.maneuvers)
    {
      if (canUseCastable(maneuver, runtime.usedCastables))
      {
        actions.push({ kind: "maneuver", maneuver });
      }
    }
  }

  return actions;
}

/**
 * Record that an action was taken. The attack flips a per-turn flag (it is NOT
 * pushed onto the maneuver ledger); maneuvers are appended to `usedCastables`.
 */
export function recordAction(runtime: CombatantRuntime, action: Action): void
{
  if (action.kind === "attack" || action.kind === "ranged")
  {
    runtime.attackedThisTurn = true;
  }
  else if (action.kind === "spell")
  {
    // A spell is cast in place of the basic attack: it spends the attack action,
    // costs essence (no regen), and goes on its cooldown.
    runtime.attackedThisTurn = true;
    runtime.resources.essence -= action.spell.costEssence;
    if (action.spell.cooldown && action.spell.cooldown > 0)
    {
      runtime.spellCooldowns[action.spell.id] = action.spell.cooldown;
    }
  }
  else if (action.kind === "maneuver")
  {
    runtime.usedCastables.push(action.maneuver);
  }
}

/** Decrement per-spell cooldowns at the start of a combatant's turn. */
export function tickSpellCooldowns(runtime: CombatantRuntime): void
{
  for (const id of Object.keys(runtime.spellCooldowns))
  {
    if (runtime.spellCooldowns[id]! > 0) runtime.spellCooldowns[id]! -= 1;
  }
}

/** Mark the end of a combatant's turn: close the maneuver ledger and re-arm the attack. */
export function endTurnLedger(runtime: CombatantRuntime): void
{
  runtime.usedCastables.push("end");
  runtime.attackedThisTurn = false;
  runtime.rollMods = []; // roll modifiers not consumed by an attack expire at turn end
}
