import type { Page } from '@playwright/test';
import { CreateEmptyCharacter } from '../src/domain/characters/Character';
import { createEmptyProfile } from '../src/common/personalization/personalizationProfile';
import type { CharacterWithRelations } from '../src/persistence/mappings/characterMapping';
import { CreateDefaultSpell, CreateDefaultPowerSpecification } from '../src/domain/characters/combat/Power';
import { CreateDefaultRace } from '../src/domain/Race';
import { CreateDefaultMount } from '../src/domain/characters/equipment/Mount';
import type { BattlePresetDto } from '../src/infrastructure/clients/battlePresetsClient';
import type { SavedSimulationDto } from '../src/infrastructure/clients/combatLabClient';

export const characterId = '01K7QBNAVF1VY58R2G1ASKYMZG';
export const characterName = 'Aldara Strażniczka Bardzo Długiej Nazwy Północnego Pogranicza';
export const perkId = '01K7QBNAVF1VY58R2G1ASKYMZH';
export const opponentId = '01K7QBNAVF1VY58R2G1ASKYMZJ';

export function fixtureCharacter() {
  const character = CreateEmptyCharacter({ name: characterName, shortName: 'Aldara', tags: ['postać', 'północne-pogranicze'], description: 'Długi opis postaci. '.repeat(12) });
  return {
    ...character,
    id: characterId,
    weapons: [], armors: [], shields: [], inventory: [], mounts: [],
    powers: [], powerSpecifications: [], spells: [], race: null,
    health: { ...character.health, vitality: 50 },
    maneuvers: [1, 2].map(index => ({ ...character.maneuvers[0], id: `mobile-maneuver-${index}`, name: `Manewr ${index}`, castTime: 'Standardowa', cooldown: index, effects: [{ type: 'damage', damage: { amount: 0, grade: 0, bonus: index }, damageType: 'zwyczajne' }] })),
    stances: character.stances, states: character.states, perks: [],
    maneuversIds: ['mobile-maneuver-1', 'mobile-maneuver-2'], stancesIds: character.stances.map(mode => mode.id), statesIds: character.states.map(mode => mode.id), perksIds: [],
    spellsIds: [], powerSpecificationsIds: [], weaponsIds: [], armorsIds: [], shieldsIds: [], inventoryIds: [], mountsIds: [],
  } as unknown as CharacterWithRelations;
}

export async function mockApplication(page: Page, { admin = true, empty = false } = {}) {
  let character = fixtureCharacter();
  let preset: BattlePresetDto | undefined;
  let savedRun: SavedSimulationDto | undefined;
  const opponent = { ...fixtureCharacter(), id: opponentId, name: 'Borowit z Południowej Strażnicy', shortName: 'Borowit' };
  const base = CreateEmptyCharacter({ name: characterName, shortName: 'Aldara', tags: [], description: 'Opis propozycji' });
  const entries: Record<string, unknown[]> = {
    maneuver: base.maneuvers, stance: base.stances, state: base.states,
    spell: [CreateDefaultSpell()], powerSpecification: [CreateDefaultPowerSpecification()], race: [CreateDefaultRace()],
    weapon: base.equipment.weapons, armor: base.equipment.armors, shield: base.equipment.shields,
    inventoryItem: base.equipment.inventory, mount: [CreateDefaultMount()],
  };
  let draft = {
    id: 'mobile-draft', status: 'pending', validationIssues: [], referenceCharacterIds: [],
    provider: 'openai', model: 'fixture', costMicroUsd: 0,
    proposal: {
      header: { name: characterName, shortName: 'Aldara', description: 'Opis propozycji. '.repeat(15), tags: ['walka'], raceId: null },
      perks: [], statistics: { characteristics: base.characteristics, attributes: base.attributes },
      talents: { talents: base.talents },
      equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
      combat: { health: base.health, defenses: base.defenses, offenses: base.offenses, defaultOffenseId: base.defaultOffenseId, defaultDefenseId: base.defaultDefenseId, maneuvers: [], stances: [], states: [], powers: [] },
      buffs: { buffProfiles: [], activeBuffProfileIds: [], stanceModifierProfiles: [], activeStanceModifierProfileIds: [], stateModifierProfiles: [], activeStateModifierProfileIds: [], otherModifierProfiles: [], activeOtherModifierProfileIds: [] },
      explanation: 'Przykładowe uzasadnienie propozycji do testu interfejsu.', warnings: [],
    },
  };
  let profile = { ...createEmptyProfile(), favoriteCharacterIds: [characterId],
    quickTagsByContext: { perks: ['defensywa', 'ofensywa', 'fechtunek', 'fortel', 'siła', 'zręczność'] },
    quickExcludeTagsByContext: { perks: ['zwierzęta', 'demoniczne', 'diabelskie', 'dystans', 'potwory', 'nieumarli'] },
  };
  const perk = { id: perkId, name: 'Strażnik Północnego Pogranicza z bardzo długą nazwą', grade: 1, price: 2, description: 'Opis atutu. '.repeat(20), tags: ['walka'], structuredRequirements: [], replaces: [], characterIds: [] };
  await page.addInitScript(({ admin }) => {
    if (admin) localStorage.setItem('cedrus-system-api-key', 'mobile-e2e-fixture');
  }, { admin });
  // All API calls are intercepted. These layout tests cannot touch a real DB.
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON() ?? {};
    let json: unknown = [];
    if (path === '/api/admin/capabilities') json = { isAdmin: admin };
    else if (path === '/api/battle-presets') {
      if (request.method() === 'POST') {
        preset = { id: 'mobile-preset', name: body.name, configuration: body.configuration, createdAt: '2026-10-18T12:00:00Z', updatedAt: '2026-10-18T12:00:00Z' };
        json = { id: preset.id };
      } else json = preset ? [preset] : [];
    }
    else if (path === '/api/battle-presets/mobile-preset') json = preset;
    else if (path === '/api/combat-lab/simulations') {
      if (request.method() === 'POST') {
        savedRun = { ...body, id: 'mobile-run', createdAt: '2026-10-18T12:00:00Z', updatedAt: '2026-10-18T12:00:00Z' };
        json = { id: 'mobile-run' };
      } else json = savedRun ? [savedRun] : [];
    }
    else if (path === '/api/combat-lab/simulations/mobile-run') json = savedRun;
    else if (path === '/api/personalization') {
      if (request.method() === 'PUT') profile = body;
      json = profile;
    }
    else if (path === '/api/tag-facets/admin') json = { facets: [], definitions: [] };
    else if (path === '/api/tag-facets/drift') json = { undefinedTags: [], unusedDefinitions: [], partialCoverage: [], ineffectiveAssignments: [] };
    else if (path.startsWith('/api/tag-facets/')) json = { entity: path.split('/').at(-1), facets: ['perks', 'maneuvers'].some(entity => path.endsWith(`/${entity}`)) ? [{ key: 'role', label: 'Rola', order: 1, selectionMode: 'single', supportsNone: true, entities: ['perks', 'maneuvers'], values: [{ tag: 'defensywa', label: 'defensywa', spellings: ['defensywa'] }, { tag: 'ofensywa', label: 'ofensywa', spellings: ['ofensywa'] }], allSpellings: ['defensywa', 'ofensywa'] }] : [], unassigned: [] };
    else if (path.startsWith('/api/tags/')) json = ['walka', 'bardzo-długi-tag-bez-skracania-informacji'];
    else if (path.startsWith('/api/requirements-management/structured/')) json = [{ requirement: { kind: 'rankless', text: 'Wymaganie o bardzo długiej nazwie do edycji na telefonie' }, count: 2 }];
    else if (path === `/api/search/${characterId}`) json = character;
    else if (path === `/api/search/${opponentId}`) json = opponent;
    else if (path.startsWith('/api/ai/character-drafts')) {
      if (path.endsWith('/balance')) json = [];
      else if (path.endsWith('/accept')) json = { characterId };
      else {
        if (request.method() === 'PATCH') draft = { ...draft, proposal: body };
        json = draft;
      }
    }
    else if (path === '/api/search') {
      if (!empty && body.entity in entries) json = entries[body.entity];
      if (!empty && body.entity === 'character') json = [character, opponent];
      if (!empty && body.entity === 'perk') json = Array.from({ length: 6 }, (_, index) => ({ ...perk, id: index === 0 ? perkId : `mobile-perk-${index}`, name: index === 0 ? perk.name : `Atut ${index} — ${perk.name}` }));
    }
    else if (path.includes('/compendium-memberships/perks/')) {
      const present = Boolean(body.present);
      const patch = { perks: present ? [perk] : [], perksIds: present ? [perk.id] : [] };
      character = { ...character, ...patch };
      json = { characterId, kind: 'perks', entityId: perk.id, present, changed: true, characterPatch: patch };
    }
    else if (path.startsWith(`/api/characters/${characterId}/`)) {
      character = { ...character, ...body };
      json = { expectedMembership: {} };
    }
    else if (path === '/api/characters' || path === '/api/characters/copy') json = characterId;
    else if (path.includes('/combat-lab/simulations/')) return route.fulfill({ status: 404, json: { error: 'Not found' } });
    await route.fulfill({ json });
  });
}
