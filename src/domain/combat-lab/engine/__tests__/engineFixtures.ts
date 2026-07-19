import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { Offense, WeaponOffense } from "@/domain/characters/combat/Offense";
import type { Defense } from "@/domain/characters/combat/Defense";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";

const weapon = (amount: number, grade: number, bonus = 0): WeaponOffense => ({
  amount,
  grade,
  bonus,
  isPhantom: false,
  critical: { power: 0, range: 0 },
});

export function makeOffense(id: string, amount: number, grade: number, bonus = 0): Offense {
  return {
    id,
    name: `offense-${id}`,
    leadingWeapon: weapon(amount, grade, bonus),
    secondaryWeapon: undefined,
    damageBonus: { amount: 0, grade: 0, bonus: 0, isPhantom: false },
    additionalDamageBonus: undefined,
  };
}

export function makeDefense(id: string, overrides: Partial<Defense> = {}): Defense {
  return {
    id,
    name: `defense-${id}`,
    immunity: 0,
    resistance: 0,
    protection: 0,
    block: 0,
    parry: 0,
    dodge: 0,
    bonus: 0,
    ...overrides,
  };
}

const initiative = (value: number): Statistic => ({ grade: 3, value, bonus: 0, testBonus: 0 });

export function makeSnapshot(
  id: string,
  opts: {
    maxHp?: number;
    offense?: Offense;
    defense?: Defense;
    maneuvers?: ManeuverDefinition[];
    initiativeValue?: number;
    lethalHealth?: number;
    lethalRounds?: number;
    barrier?: number;
  } = {},
): CombatantSnapshot {
  const offense = opts.offense ?? makeOffense(`${id}-off`, 2, 5, 2);
  const defense = opts.defense ?? makeDefense(`${id}-def`);
  return {
    id,
    name: id,
    maxHp: opts.maxHp ?? 40,
    barrier: opts.barrier ?? 0,
    lethalRounds: opts.lethalRounds ?? 0,
    lethalHealth: opts.lethalHealth ?? 0,
    defenses: [defense],
    defaultDefenseId: defense.id,
    offenses: [offense],
    defaultOffenseId: offense.id,
    maneuvers: opts.maneuvers ?? [],
    initiative: initiative(opts.initiativeValue ?? 0),
  };
}
