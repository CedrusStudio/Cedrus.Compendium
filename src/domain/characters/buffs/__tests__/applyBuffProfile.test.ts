import { describe, expect, it } from 'vitest';
import { applyActiveBuffProfile, applyBuffProfile } from '@/domain/characters/buffs/applyBuffProfile';
import { Character } from '@/domain/characters/Character';
import { createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';

function createProfileWithId(id: string) {
  return {
    ...createDefaultBuffProfile(),
    id,
  };
}

function createCharacter(): Character
{
  return {
    id: 'character-1',
    name: 'Test Character',
    shortName: 'Test',
    description: 'Test description',
    tags: [],
    race: undefined,
    characteristics:
    {
      strength: { grade: 3, value: 5, bonus: 1, testBonus: 0 },
      dexterity: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      constitution: { grade: 3, value: 4, bonus: 1, testBonus: 0 },
      mind: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      charisma: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      spellborn: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
    },
    attributes:
    {
      fencing: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      artifice: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      precision: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      initiative: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      martialArt: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      horsemanship: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      fortitude: { grade: 3, value: 2, bonus: 1, testBonus: 0 },
      reflex: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
      willpower: { grade: 3, value: 4, bonus: 0, testBonus: 0 },
    },
    talents: [],
    health:
    {
      barrier: 0,
      vitality: 10,
      toughness: 1,
      recoveryLevel: 1,
      lethalHealth: 0,
      lethalRounds: 0,
      bonus: 0,
    },
    defenses:
    [
      {
        id: 'defense-1',
        name: 'Defense',
        description: 'Defense description',
        immunity: 1,
        resistance: 2,
        protection: 3,
        block: 4,
        parry: 5,
        dodge: 6,
        bonus: 7,
      },
    ],
    offenses:
    [
      {
        id: 'offense-1',
        name: 'Offense',
        description: 'Offense description',
        leadingWeapon:
        {
          amount: 1,
          grade: 3,
          bonus: 1,
          isPhantom: false,
          critical: { power: 2, range: 1 },
        },
        secondaryWeapon: undefined,
        damageBonus:
        {
          amount: 1,
          grade: 2,
          bonus: 0,
          isPhantom: false,
        },
        additionalDamageBonus: undefined,
      },
    ],
    equipment:
    {
      weapons: [],
      armors: [],
      shields: [],
      inventory: [],
      mounts: [],
    },
    stances: [],
    states: [],
    maneuvers: [],
    powers: [],
    perks: [],
    buffProfiles: [],
    activeBuffProfileIds: [],
    stanceModifierProfiles: [],
    activeStanceModifierProfileIds: [],
    stateModifierProfiles: [],
    activeStateModifierProfileIds: [],
    otherModifierProfiles: [],
    activeOtherModifierProfileIds: [],
  };
}

describe('applyBuffProfile', () => {
  it('applies a buff profile without mutating the base character', () => {
    const character = createCharacter();
    const buffProfile = createDefaultBuffProfile();

    buffProfile.characteristics.strength.value = 2;
    buffProfile.attributes.fortitude.bonus = 3;
    buffProfile.health.vitality = 30;
    buffProfile.defense.block = 2;
    buffProfile.offense.leadingWeapon.bonus = 2;
    buffProfile.offense.leadingWeapon.criticalPower = 1;
    buffProfile.offense.damageBonus.bonus = 3;

    const result = applyBuffProfile(character, buffProfile);

    expect(result.characteristics.strength.value).toBe(7);
    expect(result.attributes.fortitude.bonus).toBe(4);
    expect(result.health.vitality).toBe(40);
    expect(result.defenses[0].block).toBe(6);
    expect(result.offenses[0].leadingWeapon.bonus).toBe(3);
    expect(result.offenses[0].leadingWeapon.critical.power).toBe(3);
    expect(result.offenses[0].damageBonus.bonus).toBe(3);
    expect(result.offenses[0].secondaryWeapon).toBeUndefined();

    expect(character.characteristics.strength.value).toBe(5);
    expect(character.attributes.fortitude.bonus).toBe(1);
    expect(character.health.vitality).toBe(10);
    expect(character.defenses[0].block).toBe(4);
    expect(character.offenses[0].leadingWeapon.bonus).toBe(1);
  });

  it('uses all active profiles in a category and clamps offense dice amount and grade to safe minimums', () => {
    const character = createCharacter();
    const buffProfile = createProfileWithId('buff-profile-1');
    const secondBuffProfile = createProfileWithId('buff-profile-2');

    buffProfile.offense.leadingWeapon.amount = -10;
    buffProfile.offense.leadingWeapon.grade = -10;
    secondBuffProfile.attributes.fortitude.bonus = 2;

    character.buffProfiles = [buffProfile, secondBuffProfile];
    character.activeBuffProfileIds = [buffProfile.id, secondBuffProfile.id];

    const result = applyActiveBuffProfile(character);

    expect(result.offenses[0].leadingWeapon.amount).toBe(0);
    expect(result.offenses[0].leadingWeapon.grade).toBe(1);
    expect(result.attributes.fortitude.bonus).toBe(3);
  });

  it('combines active profiles from buffs, stances, states, and other modifiers', () => {
    const character = createCharacter();
    const buffProfile = createProfileWithId('buff-profile-1');
    const stanceProfile = createProfileWithId('stance-profile-1');
    const stateProfile = createProfileWithId('state-profile-1');
    const otherProfile = createProfileWithId('other-profile-1');

    buffProfile.characteristics.strength.value = 1;
    stanceProfile.health.vitality = 10;
    stateProfile.defense.block = 3;
    otherProfile.offense.damageBonus.bonus = 2;

    character.buffProfiles = [buffProfile];
    character.activeBuffProfileIds = [buffProfile.id];
    character.stanceModifierProfiles = [stanceProfile];
    character.activeStanceModifierProfileIds = [stanceProfile.id];
    character.stateModifierProfiles = [stateProfile];
    character.activeStateModifierProfileIds = [stateProfile.id];
    character.otherModifierProfiles = [otherProfile];
    character.activeOtherModifierProfileIds = [otherProfile.id];

    const result = applyActiveBuffProfile(character);

    expect(result.characteristics.strength.value).toBe(6);
    expect(result.health.vitality).toBe(20);
    expect(result.defenses[0].block).toBe(7);
    expect(result.offenses[0].damageBonus.bonus).toBe(2);
  });

  it('automatically applies linked stance and state profiles for selected modes', () => {
    const character = createCharacter();
    const linkedStanceProfile = createProfileWithId('stance-linked-profile');
    const linkedStateProfile = createProfileWithId('state-linked-profile');

    character.stances = [{ id: 'stance-1' } as Character['stances'][number]];
    character.states = [{ id: 'state-1' } as Character['states'][number]];

    linkedStanceProfile.linkedEntityId = 'stance-1';
    linkedStanceProfile.characteristics.strength.value = 2;
    linkedStateProfile.linkedEntityId = 'state-1';
    linkedStateProfile.defense.block = 4;

    character.stanceModifierProfiles = [linkedStanceProfile];
    character.stateModifierProfiles = [linkedStateProfile];

    const result = applyActiveBuffProfile(character, {
      selectedStanceIds: ['stance-1'],
      selectedStateIds: ['state-1'],
    });

    expect(result.characteristics.strength.value).toBe(7);
    expect(result.defenses[0].block).toBe(8);
  });

  it('does nothing when selected modes have no linked profiles', () => {
    const character = createCharacter();
    const profile = createProfileWithId('stance-unlinked-profile');

    profile.linkedEntityId = 'stance-2';
    profile.characteristics.strength.value = 3;
    character.stanceModifierProfiles = [profile];

    const result = applyActiveBuffProfile(character, {
      selectedStanceIds: ['stance-1'],
    });

    expect(result).toBe(character);
  });

  it('returns the original character when no active buff profile exists', () => {
    const character = createCharacter();

    const result = applyActiveBuffProfile(character);

    expect(result).toBe(character);
  });
});