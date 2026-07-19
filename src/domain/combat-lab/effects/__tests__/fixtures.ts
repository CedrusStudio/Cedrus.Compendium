import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";

/**
 * The "Shield Bash" maneuver from features-to-implement/combat-simulator.md,
 * translated from the illustrative YAML into this repo's real model:
 *
 *   - `cost.ap: 2`         → castTime "Standardowa" (no numeric AP; see plan)
 *   - `requirements.weapon: shield` → hardRequirement { kind: "shield" }
 *   - damage 5             → flat DamageSpec (bonus 5, no dice)
 *   - push 2               → MoveEffect
 *   - stagger chance 35    → ChanceEffect(35) → StatusEffect("stagger")
 */
export const shieldBash: ManeuverDefinition = {
  id: "test-shield-bash",
  name: "Shield Bash",
  grade: 1,
  description: "",
  requirements: [],
  price: 1,
  tags: [],
  castTime: "Standardowa",
  cooldown: 1,
  cost: { castTime: "Standardowa" },
  hardRequirements: [{ kind: "shield" }],
  effects: [
    { type: "damage", damage: { amount: 0, grade: 0, bonus: 5 }, damageType: "physical" },
    { type: "push", distance: 2 },
    { type: "chance", chance: 35, then: [{ type: "status", status: "stagger", duration: 1 }] },
  ],
};
