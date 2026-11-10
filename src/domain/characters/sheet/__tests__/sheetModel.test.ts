import { describe, expect, it } from 'vitest';
import { Character } from '@/domain/characters/Character';
import { buildSheetModel, formatSigned } from '@/domain/characters/sheet/sheetModel';
import { BuffProfile, createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';
import { applyActiveBuffProfile } from '@/domain/characters/buffs/applyBuffProfile';
import { calculateTotalHealthForCharacter } from '@/domain/characters/combat/Health';

const generatedOn = new Date(2026, 7, 4);

const statistic = (grade: number, value: number, bonus = 0, testBonus = 0) => ({ grade, value, bonus, testBonus });

/**
 * `Entity.id` is readonly, so the id is applied by spreading rather than by
 * assignment after `createDefaultBuffProfile()`.
 */
function createProfile(id: string, name: string, apply: (profile: BuffProfile) => void = () => {}): BuffProfile
{
  const profile = createDefaultBuffProfile();
  apply(profile);

  return { ...profile, id, name };
}

function createCharacter(overrides: Partial<Character> = {}): Character
{
  return {
    id: 'char-1',
    name: 'Testowa Postać',
    shortName: 'Test',
    description: 'Pierwsze zdanie opisu. Drugie zdanie.',
    tags: ['postać'],
    race: { id: 'race-1', name: 'Elf' } as Character['race'],

    characteristics:
    {
      strength: statistic(3, 6),
      dexterity: statistic(3, 4),
      constitution: statistic(3, 4, 1),
      mind: statistic(3, 2),
      charisma: statistic(3, 8),
      spellborn: statistic(3, 7),
    },

    attributes:
    {
      fencing: statistic(4, 8, 1),
      artifice: statistic(4, 8),
      precision: statistic(3, 5),
      initiative: statistic(3, 5),
      martialArt: statistic(3, 4),
      horsemanship: statistic(3, 5),
      fortitude: statistic(4, 5, 2, 3),
      reflex: statistic(3, 6),
      willpower: statistic(4, 5),
    },

    health: { barrier: 4, vitality: 20, toughness: 3, recoveryLevel: 5, lethalHealth: 9, lethalRounds: 9, bonus: 1 },

    defenses:
    [
      { id: 'def-1', name: 'Bez tarczy', immunity: 1, resistance: 2, protection: 3, block: 4, parry: 5, dodge: 6, bonus: 7 },
      { id: 'def-2', name: 'Z tarczą', immunity: 0, resistance: 0, protection: 1, block: 2, parry: 0, dodge: 0, bonus: 0 },
    ],
    defaultDefenseId: 'def-1',

    offenses:
    [
      {
        id: 'off-1',
        name: 'Miecz',
        leadingWeapon: { amount: 2, grade: 6, bonus: 3, isPhantom: false, critical: { power: 4, range: 2 } },
        damageBonus: { amount: 1, grade: 5, bonus: 2, isPhantom: false },
      },
    ],
    defaultOffenseId: 'off-1',

    equipment:
    {
      weapons:
      [
        {
          id: 'wpn-1',
          name: 'Miecz',
          description: 'Ostry miecz. Bardzo.',
          style: 'Jednoręczny',
          range: 1,
          offense: { amount: 1, grade: 4, bonus: 1, isPhantom: false, critical: { power: 0, range: 1 } },
          damageBonus: { amount: 0, grade: 0, bonus: 2, isPhantom: false },
          tags: [],
        },
      ],
      armors: [],
      shields: [],
      inventory: [{ id: 'itm-1', name: 'Lina', description: 'Dziesięć kroków liny.', tags: [] }],
      mounts: [],
    },

    stances: [{ id: 'stc-1', name: 'Szermierska', grade: 2, description: 'Dodaje fechtunek.', price: 1, tags: [] }],
    states: [],

    maneuvers:
    [
      { id: 'man-1', name: 'Wolny', grade: 1, description: 'Powolny manewr.', castTime: 'Pełnorundowa', cooldown: 2, price: 1, tags: [] },
      { id: 'man-2', name: 'Szybki', grade: 3, description: 'Błyskawiczny manewr.', castTime: 'Natychmiastowa', cooldown: 1, price: 1, tags: [] },
    ],

    powers:
    [
      {
        id: 'pow-1',
        name: 'Światło',
        type: 'moc',
        level: 3,
        bonus: 1,
        essence: 30,
        description: 'Moc światła.',
        powerSpecificationId: 'spec-1',
        spells:
        [
          { id: 'spl-1', name: 'Blask', grade: 1, description: 'Świeci jasno.', castTime: 'Standardowa', cost: { baseCost: 5, scalingMode: 'multiply', scalingValue: 1, rounding: 'floor' }, price: 1, tags: [] },
        ],
      },
    ],

    perks: [{ id: 'prk-1', name: 'Twardziel', grade: 1, description: 'Więcej zdrowia.', price: 1, tags: [] }],

    talents:
    [
      { id: 'tal-1', name: 'akrobatyka', grade: 4, category: 'sprawność', characteristics: 'zręczność', bonus: 3, penalty: 'x2' },
      { id: 'tal-2', name: 'wzrok', grade: 3, category: 'zmysł', characteristics: 'umysł', bonus: 0, penalty: '0' },
    ],

    buffProfiles: [],
    activeBuffProfileIds: [],
    stanceModifierProfiles: [],
    activeStanceModifierProfileIds: [],
    stateModifierProfiles: [],
    activeStateModifierProfileIds: [],
    otherModifierProfiles: [],
    activeOtherModifierProfileIds: [],

    ...overrides,
  } as Character;
}

describe('buildSheetModel — header', () =>
{
  it('carries identity, race and a formatted date', () =>
  {
    const { header } = buildSheetModel(createCharacter(), { generatedOn });

    expect(header.name).toBe('Testowa Postać');
    expect(header.shortName).toBe('Test');
    expect(header.race).toBe('Elf');
    expect(header.tags).toEqual(['postać']);
    expect(header.generatedOn).toBe('2026-08-04');
  });

  it('flags long descriptions for the two-column layout', () =>
  {
    const short = buildSheetModel(createCharacter(), { generatedOn });
    const long = buildSheetModel(createCharacter({ description: Array(12).fill('linia').join('\n') }), { generatedOn });

    expect(short.header.descriptionIsLong).toBe(false);
    expect(long.header.descriptionIsLong).toBe(true);
  });

  it('keeps the description verbatim — it is printed in full, not summarised', () =>
  {
    const { header } = buildSheetModel(createCharacter(), { generatedOn });

    expect(header.description).toBe('Pierwsze zdanie opisu. Drugie zdanie.');
  });
});

describe('buildSheetModel — statistics', () =>
{
  it('reports every component of a statistic separately', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    const constitution = model.characteristics.find(stat => stat.key === 'constitution');
    expect(constitution).toMatchObject({ abbr: 'BUD', label: 'budowa', dice: '1k6', value: 4, bonus: 1, testBonus: 0, total: 5 });

    // bonus and testBonus stay distinct — the sheet must show where the number
    // came from, not just the sum.
    const fortitude = model.attributes.find(stat => stat.key === 'fortitude');
    expect(fortitude).toMatchObject({ abbr: 'WYT', dice: '1k8', value: 5, bonus: 2, testBonus: 3, total: 10 });
  });

  it('totals a statistic with no modifiers to its bare value', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.characteristics.find(stat => stat.key === 'strength'))
      .toMatchObject({ value: 6, bonus: 0, testBonus: 0, total: 6 });
  });

  it('lists all six characteristics and all nine attributes', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.characteristics).toHaveLength(6);
    expect(model.attributes).toHaveLength(9);
  });
});

describe('buildSheetModel — vitals', () =>
{
  it('matches the app-wide health calculation', () =>
  {
    const character = createCharacter();
    const model = buildSheetModel(character, { generatedOn });

    expect(model.vitals.totalHealth).toBe(calculateTotalHealthForCharacter(character));
    expect(model.vitals.totalHealth).toBe(41);
    expect(model.vitals.recoveryLevel).toBe(5);
    expect(model.vitals.rows).toContainEqual({ label: 'bariera', value: '4' });
  });
});

describe('buildSheetModel — defenses and offenses', () =>
{
  it('precomputes all three reduction totals', () =>
  {
    const [defense] = buildSheetModel(createCharacter(), { generatedOn }).defenses;

    expect(defense.fullReduction).toBe(25);
    expect(defense.blockReduction).toBe(14);
    expect(defense.directReduction).toBe(10);
  });

  it('marks the default defense and offense', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.defenses.map(defense => defense.isDefault)).toEqual([true, false]);
    expect(model.offenses[0].isDefault).toBe(true);
  });

  it('formats dice and critical the way the app does', () =>
  {
    const [offense] = buildSheetModel(createCharacter(), { generatedOn }).offenses;

    expect(offense.leading).toBe('2(k12+3)');
    expect(offense.leadingCritical).toBe('10-12/+4');
    expect(offense.damage).toBe('1k10+2');
    expect(offense.secondary).toBeUndefined();
    expect(offense.additionalDamage).toBeUndefined();
  });
});

describe('buildSheetModel — equipment', () =>
{
  it('exposes gear values as separate fields, not one joined string', () =>
  {
    const [weapon] = buildSheetModel(createCharacter(), { generatedOn }).equipment.weapons;

    expect(weapon).toMatchObject({
      name: 'Miecz',
      style: 'Jednoręczny',
      range: 1,
      attack: '1k8+1',
      critical: '7-8',
      damage: '+2',
      summary: 'Ostry miecz.',
    });
  });

  it('leaves absent categories empty', () =>
  {
    const equipment = buildSheetModel(createCharacter(), { generatedOn }).equipment;

    expect(equipment.armors).toEqual([]);
    expect(equipment.mounts).toEqual([]);
    expect(equipment.inventory).toHaveLength(1);
  });
});

describe('buildSheetModel — actions', () =>
{
  it('sorts maneuvers fastest first', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.maneuvers.map(maneuver => maneuver.name)).toEqual(['Szybki', 'Wolny']);
  });

  it('summarises descriptions to one line', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.maneuvers[0].summary).toBe('Błyskawiczny manewr.');
    expect(model.stances[0].summary).toBe('Dodaje fechtunek.');
  });

  it('returns empty arrays rather than placeholders for absent categories', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.states).toEqual([]);
  });
});

describe('buildSheetModel — powers and spells', () =>
{
  it('reads spells from the power, not from the character', () =>
  {
    // Character has no `spells` field at all — they hang off Power.spells.
    const [power] = buildSheetModel(createCharacter(), { generatedOn }).powers;

    expect(power.name).toBe('Światło');
    expect(power.essence).toBe(30);
    expect(power.spells).toHaveLength(1);
    expect(power.spells[0]).toMatchObject({ name: 'Blask', grade: 1, cost: '5 + SZ', summary: 'Świeci jasno.' });
  });

  it('survives a power with no spells', () =>
  {
    const character = createCharacter();
    character.powers[0].spells = [];

    expect(buildSheetModel(character, { generatedOn }).powers[0].spells).toEqual([]);
  });
});

describe('buildSheetModel — talents', () =>
{
  it('groups by category in rulebook order', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.talents.map(group => group.category)).toEqual(['zmysł', 'sprawność']);
  });

  it('formats the roll and keeps a real penalty only', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });
    const acrobatics = model.talents.find(group => group.category === 'sprawność')?.talents[0];
    const sight = model.talents.find(group => group.category === 'zmysł')?.talents[0];

    expect(acrobatics).toMatchObject({ display: '1k8+3', characteristic: 'zręczność', penalty: 'x2' });
    // "0" means no penalty and must not print as one.
    expect(sight).toMatchObject({ display: '1k6+0' });
    expect(sight?.penalty).toBeUndefined();
  });

  it('keeps categories outside the enum, sorted after the known ones', () =>
  {
    const character = createCharacter();
    character.talents = [
      { id: 'tal-3', name: 'żeglarstwo', grade: 3, category: 'morskie', characteristics: 'siła', bonus: 0, penalty: null },
      ...character.talents,
    ];

    expect(buildSheetModel(character, { generatedOn }).talents.map(group => group.category))
      .toEqual(['zmysł', 'sprawność', 'morskie']);
  });
});

describe('buildSheetModel — buffs', () =>
{
  it('reports active profiles as non-zero deltas', () =>
  {
    const profile = createProfile('buf-1', 'Pełna Moc', draft =>
    {
      draft.characteristics.strength.value = 2;
      draft.attributes.fencing.testBonus = 1;
      draft.defense.block = 3;
      draft.health.vitality = -2;
      draft.offense.leadingWeapon.criticalRange = 1;
    });

    const character = createCharacter({ buffProfiles: [profile], activeBuffProfileIds: ['buf-1'] });
    const [buff] = buildSheetModel(character, { generatedOn }).buffs;

    expect(buff).toMatchObject({ name: 'Pełna Moc', source: 'wzmocnienie' });
    expect(buff.changes).toEqual([
      'siła +2',
      'fechtunek test +1',
      'żywotność -2',
      'blokowanie +3',
      'broń wiodąca zakres kryt. +1',
    ]);
  });

  it('ignores inactive profiles and profiles that change nothing', () =>
  {
    const inactive = createProfile('buf-inactive', 'Nieaktywny', draft => { draft.characteristics.strength.value = 5; });
    const empty = createProfile('buf-empty', 'Pusty');

    const character = createCharacter({
      buffProfiles: [inactive, empty],
      activeBuffProfileIds: ['buf-empty'],
    });

    expect(buildSheetModel(character, { generatedOn }).buffs).toEqual([]);
  });

  it('reports the statistics of the character it is handed, buffed or not', () =>
  {
    const profile = createProfile('buf-1', 'Siłacz', draft => { draft.characteristics.strength.value = 10; });
    const character = createCharacter({ buffProfiles: [profile], activeBuffProfileIds: ['buf-1'] });

    // Folding buffs in is `CharacterSheetView`'s job (it calls
    // `applyActiveBuffProfile` exactly like `CharacterView` does); the model
    // itself does no such thing.
    expect(buildSheetModel(character, { generatedOn }).characteristics.find(stat => stat.key === 'strength')?.value).toBe(6);

    const buffed = applyActiveBuffProfile(character);
    expect(buildSheetModel(buffed, { generatedOn }).characteristics.find(stat => stat.key === 'strength')?.value).toBe(16);

    // …and the profile is still listed, so the reader can see where +10 came from.
    expect(buildSheetModel(buffed, { generatedOn }).buffs.map(buff => buff.name)).toEqual(['Siłacz']);
  });

  it('lists a profile once even when several slots reference it', () =>
  {
    const profile = createProfile('buf-1', 'Wspólny', draft => { draft.characteristics.strength.value = 1; });

    const character = createCharacter({
      buffProfiles: [profile],
      activeBuffProfileIds: ['buf-1'],
      stanceModifierProfiles: [profile],
      activeStanceModifierProfileIds: ['buf-1'],
    });

    expect(buildSheetModel(character, { generatedOn }).buffs).toHaveLength(1);
  });
});

describe('buildSheetModel — appendix', () =>
{
  it('groups full descriptions and drops empty groups', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    expect(model.appendix.map(group => group.title)).toEqual(['manewry', 'postawy', 'atuty', 'zaklęcia — Światło']);
  });

  it('sorts appendix entries by name — it is a lookup section, not a play order', () =>
  {
    const model = buildSheetModel(createCharacter(), { generatedOn });

    // The maneuver table above is ordered by cast time; the appendix is not.
    expect(model.appendix[0].entries.map(entry => entry.name)).toEqual(['Szybki', 'Wolny']);
    expect(model.appendix[0].entries.map(entry => entry.description))
      .toEqual(['Błyskawiczny manewr.', 'Powolny manewr.']);
  });
});

describe('buildSheetModel — empty character', () =>
{
  it('produces empty collections instead of throwing', () =>
  {
    const empty = createCharacter({
      defenses: [],
      offenses: [],
      maneuvers: [],
      stances: [],
      states: [],
      perks: [],
      powers: [],
      talents: [],
      equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
      description: '',
      race: undefined,
    });

    const model = buildSheetModel(empty, { generatedOn });

    expect(model.defenses).toEqual([]);
    expect(model.talents).toEqual([]);
    expect(model.appendix).toEqual([]);
    expect(model.header.race).toBeUndefined();
    expect(model.header.descriptionIsLong).toBe(false);
  });
});

describe('formatSigned', () =>
{
  it('always shows the sign', () =>
  {
    expect(formatSigned(3)).toBe('+3');
    expect(formatSigned(0)).toBe('+0');
    expect(formatSigned(-2)).toBe('-2');
  });
});

describe('sheet output for alternate and sparse equipment', () => {
  it('prints an optional secondary weapon and damage without a fake die pool', () => {
    const character = createCharacter();
    const offense = character.offenses[0];
    const empty = { amount: 0, grade: 0, bonus: 0, isPhantom: false };
    character.offenses = [{
      ...offense,
      leadingWeapon: { ...empty, critical: { power: 0, range: 0 } },
      secondaryWeapon: { ...empty, amount: 2, grade: 3, bonus: 1, critical: { power: -2, range: 1 } },
      damageBonus: empty,
      additionalDamageBonus: { ...empty, bonus: 2 },
    }];
    character.equipment.weapons = [{ ...character.equipment.weapons[0], offense: character.offenses[0].leadingWeapon }];
    const model = buildSheetModel(character, { generatedOn });
    expect(model.offenses[0]).toMatchObject({ leading: '—', secondary: '2(k6+1)', damage: '—', additionalDamage: '+2' });
    expect(model.offenses[0].secondaryCritical).toMatch(/\/-2$/);
    expect(model.equipment.weapons[0].attack).toBe('—');
  });

  it('distinguishes adjustments to the statistic die, bonuses and weapon criticals', () => {
    const profile = createProfile('buf', 'Zapas', draft => {
      draft.attributes.fencing.grade = 1;
      draft.attributes.fencing.bonus = -2;
      draft.offense.secondaryWeapon.amount = 2;
      draft.offense.secondaryWeapon.grade = 1;
      draft.offense.secondaryWeapon.bonus = -3;
      draft.offense.secondaryWeapon.criticalPower = 2;
    });
    const model = buildSheetModel(createCharacter({ buffProfiles: [profile], activeBuffProfileIds: ['buf'] }), { generatedOn });
    expect(model.buffs[0].changes).toEqual([
      'fechtunek kość +1', 'fechtunek bonus -2',
      'broń drugorzędna kości +2', 'broń drugorzędna szczebel +1',
      'broń drugorzędna bonus -3', 'broń drugorzędna siła kryt. +2',
    ]);
  });

  it('sorts maneuvers with the same cast time by name and retains uncategorized talents', () => {
    const character = createCharacter();
    const maneuver = character.maneuvers[1];
    character.maneuvers = [{ ...maneuver, id: 'b', name: 'Zasłona' }, { ...maneuver, id: 'a', name: 'Atak' }];
    character.talents = [
      { ...character.talents[0], name: 'Akrobatyka', category: ' ' },
      { ...character.talents[1], name: 'Wzrok' },
    ];
    const model = buildSheetModel(character, { generatedOn });
    expect(model.maneuvers.map(entry => entry.name)).toEqual(['Atak', 'Zasłona']);
    expect(model.talents.map(group => group.category)).toEqual(['zmysł', 'pozostałe']);
    expect(model.talents[1].talents[0].name).toBe('Akrobatyka');
  });
});
