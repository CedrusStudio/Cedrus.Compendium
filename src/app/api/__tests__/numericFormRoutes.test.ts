import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateDefaultPerk } from '@/domain/characters/Perk';
import { CreateDefaultManeuver } from '@/domain/characters/combat/Maneuver';
import { CreateDefaultStance, CreateDefaultState } from '@/domain/characters/combat/Mode';
import { CreateDefaultSpell, CreateDefaultPowerSpecification, CreateDefaultPowerOffense } from '@/domain/characters/combat/Power';
import { CreateDefaultRace } from '@/domain/Race';
import { CreateDefaultWeapon } from '@/domain/characters/equipment/Weapon';
import { CreateDefaultArmor } from '@/domain/characters/equipment/Armor';
import { CreateDefaultShield } from '@/domain/characters/equipment/Shield';
import { CreateDefaultMount } from '@/domain/characters/equipment/Mount';
import { CreateDefaultTalent } from '@/domain/characters/Talent';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';

const { dbCall, models, characterUpdates } = vi.hoisted(() => {
  const dbCall = vi.fn();
  const models = Object.fromEntries(['perk', 'maneuver', 'stance', 'state', 'spell', 'race', 'powerSpecification', 'weapon', 'armor', 'shield', 'mount'].map(model => [model, {
    findUnique: vi.fn(), delete: vi.fn(),
    create: vi.fn(async ({ data }: { data: { id: string } }) => { dbCall(model, 'create', data); return { id: data.id }; }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: unknown }) => { dbCall(model, 'update', data); return { id: where.id }; }),
  }]));
  const characterUpdates = Object.fromEntries(['Statistics', 'Talents', 'Equipment', 'Buffs'].map(section => [
    `updateCharacter${section}`, vi.fn(async (_id: string, data: unknown) => { dbCall(section, 'update', data); return true; }),
  ]));
  characterUpdates.copyCreateCharacter = vi.fn(async (data: unknown) => { dbCall('copy', 'create', data); return true; });
  return { dbCall, models, characterUpdates };
});
vi.mock('@/lib/env', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/env')>(), adminApiKeys: ['numeric-form-test'] }));
vi.mock('@/lib/prisma', () => ({ default: models }));
vi.mock('@/persistence/characters/charactersRepository', () => characterUpdates);

const id = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const config = [
  { path: 'perks', body: CreateDefaultPerk, field: 'price', post: () => import('../perks/route'), put: () => import('../perks/[id]/route') },
  { path: 'maneuvers', body: CreateDefaultManeuver, field: 'grade', post: () => import('../maneuvers/route'), put: () => import('../maneuvers/[id]/route') },
  { path: 'stances', body: CreateDefaultStance, field: 'price', post: () => import('../stances/route'), put: () => import('../stances/[id]/route') },
  { path: 'states', body: CreateDefaultState, field: 'price', post: () => import('../states/route'), put: () => import('../states/[id]/route') },
  { path: 'spells', body: CreateDefaultSpell, field: 'cost.baseCost', storedField: 'costBase', post: () => import('../spells/route'), put: () => import('../spells/[id]/route') },
  { path: 'races', body: CreateDefaultRace, field: 'strengthModifier', post: () => import('../races/route'), put: () => import('../races/[id]/route') },
  { path: 'powers/specifications', body: () => ({ ...CreateDefaultPowerSpecification(), offenses: [CreateDefaultPowerOffense()] }), field: 'offenses.0.cost', post: () => import('../powers/specifications/route'), put: () => import('../powers/specifications/[id]/route') },
  { path: 'equipment/weapons', body: CreateDefaultWeapon, field: 'range', post: () => import('../equipment/weapons/route'), put: () => import('../equipment/weapons/[id]/route') },
  { path: 'equipment/armors', body: CreateDefaultArmor, field: 'protection', post: () => import('../equipment/armors/route'), put: () => import('../equipment/armors/[id]/route') },
  { path: 'equipment/shields', body: CreateDefaultShield, field: 'block', post: () => import('../equipment/shields/route'), put: () => import('../equipment/shields/[id]/route') },
  { path: 'equipment/mounts', body: CreateDefaultMount, field: 'horsemanshipBonus', post: () => import('../equipment/mounts/route'), put: () => import('../equipment/mounts/[id]/route') },
];

function setField(body: unknown, path: string, value: unknown)
{
  const keys = path.split('.');
  let target = body as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[keys.at(-1)!] = value;
}

function getField(body: unknown, path: string): unknown
{
  return path.split('.').reduce((value, key) => (value as Record<string, unknown>)[key], body);
}

function request(path: string, method: string, body: unknown)
{
  return new NextRequest(`http://localhost/api/${path}`, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'x-api-key': 'numeric-form-test' } });
}

describe('numeric validation at compendium API boundaries', () => {
  beforeEach(() => vi.clearAllMocks());
  for (const entry of config)
  {
    for (const method of ['POST', 'PUT'] as const)
    {
      const run = async (body: unknown) => method === 'POST'
        ? (await entry.post()).POST(request(entry.path, method, body))
        : (await entry.put()).PUT(request(`${entry.path}/${id}`, method, body), { params: Promise.resolve({ id }) });

      it.each(['', ' ', null])(`${method} /${entry.path} rejects missing ${entry.field}: %j without a write`, async value => {
        const body = structuredClone(entry.body());
        setField(body, entry.field, value);
        const response = await run(body);
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ message: 'Uzupełnij pole' });
        expect(dbCall).not.toHaveBeenCalled();
      });

      it(`${method} /${entry.path} writes an explicitly provided zero as a number`, async () => {
        const body = structuredClone(entry.body());
        setField(body, entry.field, '0');
        const response = await run(body);
        expect(await response.json()).not.toHaveProperty('issues');
        expect(response.status).toBe(method === 'POST' ? 201 : 200);
        expect(dbCall).toHaveBeenCalledOnce();
        expect(getField(dbCall.mock.calls[0][2], 'storedField' in entry ? entry.storedField! : entry.field)).toBe(0);
      });
    }
  }

  it.each(['maneuvers', 'spells'])('clearing an optional cooldown in PUT /%s explicitly removes the old cooldown', async path => {
    const entry = config.find(item => item.path === path)!;
    const body = { ...entry.body(), cooldown: undefined };
    const response = await (await entry.put()).PUT(request(`${path}/${id}`, 'PUT', body), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(dbCall.mock.calls[0][2]).toMatchObject({ cooldown: 0 });
  });

  it('does not write malformed JSON or a mismatched entity ID', async () => {
    const { POST } = await import('../maneuvers/route');
    const malformed = new NextRequest('http://localhost/api/maneuvers', { method: 'POST', body: '{' });
    expect((await POST(malformed)).status).toBe(400);
    const { PUT } = await import('../perks/[id]/route');
    const otherId = '01ARZ3NDEKTSV4RRFFQ69G5FAW';
    const mismatch = await PUT(request(`perks/${otherId}`, 'PUT', CreateDefaultPerk()), { params: Promise.resolve({ id: otherId }) });
    expect(mismatch.status).toBe(400);
    expect(dbCall).not.toHaveBeenCalled();
  });
});

const base = CreateEmptyCharacter({ name: 'Testowa postać', shortName: 'Test', description: '', tags: [] });
const characterSections = [
  { section: 'statistics', body: () => ({ characteristics: base.characteristics, attributes: base.attributes }), field: 'attributes.fencing.bonus', load: () => import('../characters/[id]/statistics/route') },
  { section: 'talents', body: () => ({ talents: [CreateDefaultTalent()] }), field: 'talents.0.bonus', load: () => import('../characters/[id]/talents/route') },
  { section: 'equipment', body: () => ({ weapons: [CreateDefaultWeapon()], armors: [], shields: [], mounts: [], inventory: [] }), field: 'weapons.0.range', load: () => import('../characters/[id]/equipment/route') },
  { section: 'buffs', body: () => ({ buffProfiles: [createDefaultBuffProfile()], activeBuffProfileIds: [], stanceModifierProfiles: [], activeStanceModifierProfileIds: [], stateModifierProfiles: [], activeStateModifierProfileIds: [], otherModifierProfiles: [], activeOtherModifierProfileIds: [] }), field: 'buffProfiles.0.health.bonus', load: () => import('../characters/[id]/buffs/route') },
];

describe('numeric validation of other character sections', () => {
  beforeEach(() => vi.clearAllMocks());
  for (const entry of characterSections)
  {
    it(`blocks a blank ${entry.section} value and accepts explicit zero`, async () => {
      const body = structuredClone(entry.body());
      setField(body, entry.field, '');
      const route = await entry.load();
      const context = { params: Promise.resolve({ id }) };
      const invalid = await route.PUT(request(`characters/${id}/${entry.section}`, 'PUT', body), context);
      expect(invalid.status).toBe(400);
      expect(await invalid.json()).toMatchObject({ message: 'Uzupełnij pole' });
      expect(dbCall).not.toHaveBeenCalled();
      setField(body, entry.field, '0');
      const valid = await route.PUT(request(`characters/${id}/${entry.section}`, 'PUT', body), context);
      expect(valid.status).toBe(200);
      expect(dbCall).toHaveBeenCalledOnce();
      expect(getField(dbCall.mock.calls[0][2], entry.field)).toBe(0);
    });
  }
});

it('rejects blank numeric data in character copies before persistence', async () => {
  const { POST } = await import('../characters/copy/route');
  const body = { ...base, powers: [], description: 'Opis kopiowanej postaci', raceId: undefined, weaponsIds: [], armorsIds: [], shieldsIds: [], inventoryIds: [], mountsIds: [],
    stancesIds: [], statesIds: [], maneuversIds: [], spellsIds: [], perksIds: [], powerSpecificationsIds: [] };
  dbCall.mockClear();
  setField(body, 'health.bonus', '');
  const invalid = await POST(request('characters/copy', 'POST', body));
  expect(invalid.status).toBe(400);
  expect(dbCall).not.toHaveBeenCalled();
  setField(body, 'health.bonus', '0');
  const valid = await POST(request('characters/copy', 'POST', body));
  expect(await valid.json()).not.toHaveProperty('issues');
  expect(valid.status).toBe(201);
  expect(dbCall.mock.calls[0][2]).toMatchObject({ health: { bonus: 0 } });
});


describe('effect validation at compendium write boundaries', () => {
  afterEach(async () => (await import('@/domain/combat-lab/plugins/registry')).resetRegistry());
  for (const entry of config.filter(item => ['maneuvers', 'stances', 'states'].includes(item.path)))
  {
    for (const method of ['POST', 'PUT'] as const)
    {
      const run = async (effects: unknown[]) => {
        const body = { ...entry.body(), effects };
        return method === 'POST'
          ? (await entry.post()).POST(request(entry.path, method, body))
          : (await entry.put()).PUT(request(`${entry.path}/${id}`, method, body), { params: Promise.resolve({ id }) });
      };

      it.each([
        { type: 'chance', chance: 50, then: [{ type: 'push', distance: 1, typo: 2 }] },
        { type: 'custom', effectType: 'lifesteal', data: { amount: 2, typo: 1 } },
        { type: 'resource', resource: 'mana', delta: 1 },
      ])(`${method} /${entry.path} rejects invalid effects before persistence: %j`, async effect => {
        const response = await run([effect]);
        expect(response.status).toBe(400);
        expect(await response.json()).toHaveProperty('issues');
        expect(dbCall).not.toHaveBeenCalled();
      });

      it(`${method} /${entry.path} persists parsed plugin defaults`, async () => {
        const { z } = await import('zod');
        const { registerPlugin } = await import('@/domain/combat-lab/plugins/registry');
        registerPlugin({ id: 'write-test', name: 'Test', version: '1', effects: [{
          effectType: 'with-default', apply() {}, describe: () => '',
          schema: z.object({ amount: z.number().default(3) }),
        }] });
        const response = await run([{ type: 'custom', effectType: 'with-default', data: {} }]);
        expect(response.status).toBe(method === 'POST' ? 201 : 200);
        expect(dbCall).toHaveBeenCalledOnce();
        expect(dbCall.mock.calls[0][2]).toMatchObject({ effects: [{ type: 'custom', effectType: 'with-default', data: { amount: 3 } }] });
      });
    }
  }
});
