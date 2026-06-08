import { Character } from "@/domain/characters/Character";
import { BuffProfile, DamageOffenseBuff, StatisticBuff, WeaponOffenseBuff } from "@/domain/characters/buffs/BuffProfile";
import { Statistic } from "@/domain/characters/statistics/Statistic";
import { Health } from "@/domain/characters/combat/Health";
import { Defense } from "@/domain/characters/combat/Defense";
import { DamageOffense, Offense, WeaponOffense } from "@/domain/characters/combat/Offense";

export function getActiveBuffProfiles(character: Character): BuffProfile[]
{
  return resolveActiveProfiles(character.buffProfiles, character.activeBuffProfileIds);
}

export function getActiveStanceModifierProfiles(character: Character): BuffProfile[]
{
  return resolveActiveProfiles(character.stanceModifierProfiles, character.activeStanceModifierProfileIds);
}

export function getActiveStateModifierProfiles(character: Character): BuffProfile[]
{
  return resolveActiveProfiles(character.stateModifierProfiles, character.activeStateModifierProfileIds);
}

export function getActiveOtherModifierProfiles(character: Character): BuffProfile[]
{
  return resolveActiveProfiles(character.otherModifierProfiles, character.activeOtherModifierProfileIds);
}

export function applyActiveBuffProfile(character: Character): Character
{
  const activeProfiles = dedupeProfilesById([
    ...getActiveBuffProfiles(character),
    ...getActiveStanceModifierProfiles(character),
    ...getActiveStateModifierProfiles(character),
    ...getActiveOtherModifierProfiles(character),
  ]);

  if (activeProfiles.length === 0)
  {
    return character;
  }

  return applyBuffProfiles(character, activeProfiles);
}

export function applyBuffProfiles(character: Character, buffProfiles: BuffProfile[]): Character
{
  return buffProfiles.reduce(applyBuffProfile, character);
}

export function applyBuffProfile(character: Character, buffProfile: BuffProfile): Character
{
  return {
    ...character,
    characteristics:
    {
      strength: applyStatisticBuff(character.characteristics.strength, buffProfile.characteristics.strength),
      dexterity: applyStatisticBuff(character.characteristics.dexterity, buffProfile.characteristics.dexterity),
      constitution: applyStatisticBuff(character.characteristics.constitution, buffProfile.characteristics.constitution),
      mind: applyStatisticBuff(character.characteristics.mind, buffProfile.characteristics.mind),
      charisma: applyStatisticBuff(character.characteristics.charisma, buffProfile.characteristics.charisma),
      spellborn: applyStatisticBuff(character.characteristics.spellborn, buffProfile.characteristics.spellborn),
    },
    attributes:
    {
      fencing: applyStatisticBuff(character.attributes.fencing, buffProfile.attributes.fencing),
      artifice: applyStatisticBuff(character.attributes.artifice, buffProfile.attributes.artifice),
      precision: applyStatisticBuff(character.attributes.precision, buffProfile.attributes.precision),
      initiative: applyStatisticBuff(character.attributes.initiative, buffProfile.attributes.initiative),
      martialArt: applyStatisticBuff(character.attributes.martialArt, buffProfile.attributes.martialArt),
      horsemanship: applyStatisticBuff(character.attributes.horsemanship, buffProfile.attributes.horsemanship),
      fortitude: applyStatisticBuff(character.attributes.fortitude, buffProfile.attributes.fortitude),
      reflex: applyStatisticBuff(character.attributes.reflex, buffProfile.attributes.reflex),
      willpower: applyStatisticBuff(character.attributes.willpower, buffProfile.attributes.willpower),
    },
    health: applyHealthBuff(character.health, buffProfile.health),
    defenses: character.defenses.map(defense => applyDefenseBuff(defense, buffProfile.defense)),
    offenses: character.offenses.map(offense => applyOffenseBuff(offense, buffProfile)),
  };
}

function applyStatisticBuff(statistic: Statistic, buff: StatisticBuff): Statistic
{
  return {
    grade: Math.max(1, statistic.grade + buff.grade),
    value: statistic.value + buff.value,
    bonus: statistic.bonus + buff.bonus,
    testBonus: statistic.testBonus + buff.testBonus,
  };
}

function applyHealthBuff(health: Health, buff: BuffProfile["health"]): Health
{
  return {
    barrier: health.barrier + buff.barrier,
    vitality: health.vitality + buff.vitality,
    toughness: health.toughness + buff.toughness,
    recoveryLevel: health.recoveryLevel + buff.recoveryLevel,
    lethalHealth: health.lethalHealth + buff.lethalHealth,
    lethalRounds: health.lethalRounds + buff.lethalRounds,
    bonus: health.bonus + buff.bonus,
  };
}

function applyDefenseBuff(defense: Defense, buff: BuffProfile["defense"]): Defense
{
  return {
    ...defense,
    immunity: defense.immunity + buff.immunity,
    resistance: defense.resistance + buff.resistance,
    protection: defense.protection + buff.protection,
    block: defense.block + buff.block,
    parry: defense.parry + buff.parry,
    dodge: defense.dodge + buff.dodge,
    bonus: defense.bonus + buff.bonus,
  };
}

function applyOffenseBuff(offense: Offense, buffProfile: BuffProfile): Offense
{
  return {
    ...offense,
    leadingWeapon: applyWeaponOffenseBuff(offense.leadingWeapon, buffProfile.offense.leadingWeapon),
    secondaryWeapon: offense.secondaryWeapon ? applyWeaponOffenseBuff(offense.secondaryWeapon, buffProfile.offense.secondaryWeapon) : undefined,
    damageBonus: applyDamageOffenseBuff(offense.damageBonus, buffProfile.offense.damageBonus),
    additionalDamageBonus: offense.additionalDamageBonus ? applyDamageOffenseBuff(offense.additionalDamageBonus, buffProfile.offense.additionalDamageBonus) : undefined,
  };
}

function applyDamageOffenseBuff(offense: DamageOffense, buff: DamageOffenseBuff): DamageOffense
{
  return {
    ...offense,
    amount: Math.max(0, offense.amount + buff.amount),
    grade: Math.max(1, offense.grade + buff.grade),
    bonus: offense.bonus + buff.bonus,
  };
}

function applyWeaponOffenseBuff(offense: WeaponOffense, buff: WeaponOffenseBuff): WeaponOffense
{
  return {
    ...applyDamageOffenseBuff(offense, buff),
    critical:
    {
      power: offense.critical.power + buff.criticalPower,
      range: offense.critical.range + buff.criticalRange,
    },
  };
}

function resolveActiveProfiles(profiles: BuffProfile[], activeProfileIds: string[]): BuffProfile[]
{
  if (activeProfileIds.length === 0)
  {
    return [];
  }

  return profiles.filter(profile => activeProfileIds.includes(profile.id));
}

function dedupeProfilesById(profiles: BuffProfile[]): BuffProfile[]
{
  return [...new Map(profiles.map(profile => [profile.id, profile])).values()];
}