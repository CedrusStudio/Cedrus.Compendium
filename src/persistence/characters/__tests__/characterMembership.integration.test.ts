import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const testUrl = vi.hoisted(() => {
  const value = process.env.MEMBERSHIP_TEST_DATABASE_URL;
  if (value) {
    const url = new URL(value);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.startsWith('/cedrus_membership_test')) {
      throw new Error('Membership integration tests require a dedicated local cedrus_membership_test database.');
    }
    process.env.DATABASE_CONNECTION_STRING = value;
  }
  return value;
});
vi.mock('@/lib/env', () => ({ adminApiKeys: ['test-key'] }));

import prisma from '@/lib/prisma';
import { setCharacterMembership } from '../characterMembershipRepository';
import {
  updateCharacterCombat, updateCharacterDetails, updateCharacterStatistics, updateCharacterTalents,
  updateCharacterBuffs, updateCharacterEquipment, deleteCharacter, getCharactersVisibleToApiKeyByIds,
} from '../charactersRepository';
import { withCharacterAccess } from '../withCharacterAccess';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { toCharacterHeaderPersistenceModel, toCharacter } from '@/persistence/mappings/characterMapping';
import { includeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';
import { membershipSnapshot } from '@/domain/characters/characterMembership';
import { CharacterMembershipConflictError } from '../characterMembershipErrors';
import { defaultSpell, defaultPower } from '@/domain/characters/combat/Power';
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';

describe.skipIf(!testUrl)('character membership against real MongoDB', () => {
  const characterIds: string[] = [];
  const entityIds: string[] = [];
  const key = 'test-key';
  async function expectConflict(promise: Promise<unknown>) {
    try { await promise; throw new Error('Expected conflict'); } catch (error) {
      if (!(error instanceof CharacterMembershipConflictError)) throw error;
    }
  }

  async function createCharacter(apiKeys: string[] = []) {
    const id = `membership-test-${randomUUID()}`;
    const data = toCharacterHeaderPersistenceModel({ name: id, shortName: id, description: 'Test', tags: [] });
    const character = await prisma.character.create({ data: { ...data, id, apiKeys } });
    characterIds.push(id);
    return character;
  }
  async function createEntry(kind: 'maneuver' | 'perk' | 'stance' | 'state') {
    const id = `membership-test-${randomUUID()}`;
    const common = { id, name: id, grade: 1, description: 'Test', price: 1, tags: [], characterIds: [] };
    if (kind === 'maneuver') await prisma.maneuver.create({ data: { ...common, castTime: 'Standardowa', cooldown: 0 } });
    else if (kind === 'perk') await prisma.perk.create({ data: common });
    else if (kind === 'stance') await prisma.stance.create({ data: common });
    else await prisma.state.create({ data: common });
    entityIds.push(id);
    return id;
  }

  beforeAll(async () => { await prisma.$connect(); });
  afterAll(async () => {
    await prisma.character.deleteMany({ where: { id: { in: characterIds } } });
    const where = { id: { in: entityIds } };
    await Promise.all([prisma.maneuver.deleteMany({ where }), prisma.perk.deleteMany({ where }), prisma.stance.deleteMany({ where }), prisma.state.deleteMany({ where }),
      prisma.spell.deleteMany({ where }), prisma.powerSpecification.deleteMany({ where })]);
    await prisma.$disconnect();
  });

  it('filters private records in batch reads and rejects cross-key writes/deletion', async () => {
    const hidden = await createCharacter(['owner-key']);
    const visible = await createCharacter();
    const result = await getCharactersVisibleToApiKeyByIds([hidden.id, visible.id], key);
    expect(result.map(character => character.id)).toEqual([visible.id]);
    const data = createPendingDraft().proposal!;
    const operations = [
      () => updateCharacterStatistics(hidden.id, data.statistics, key),
      () => updateCharacterTalents(hidden.id, data.talents, key),
      () => updateCharacterBuffs(hidden.id, data.buffs, key),
      () => updateCharacterEquipment(hidden.id, data.equipment, key),
      () => deleteCharacter(hidden.id, key),
    ];
    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({ status: 404, message: 'Character not found' });
    }
    expect(await prisma.character.findUniqueOrThrow({ where: { id: hidden.id } })).toEqual(hidden);
  });

  it('allows public and matching-key writes', async () => {
    const data = createPendingDraft().proposal!;
    for (const keys of [[], [key]]) {
      const character = await createCharacter(keys);
      await updateCharacterStatistics(character.id, data.statistics, key);
      await updateCharacterTalents(character.id, data.talents, key);
      await updateCharacterBuffs(character.id, data.buffs, key);
      await updateCharacterEquipment(character.id, data.equipment, key);
      await deleteCharacter(character.id, key);
      expect(await prisma.character.findUnique({ where: { id: character.id } })).toBeNull();
    }
  });

  it('rolls back a failed guarded write', async () => {
    const character = await createCharacter();
    await expect(withCharacterAccess(character.id, key, async tx => {
      await tx.character.update({ where: { id: character.id }, data: { description: 'Must roll back' } });
      throw new Error('Simulated failure');
    })).rejects.toThrow('Simulated failure');
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).description).toBe('Test');
  });

  it('does not commit a write after concurrent access revocation', async () => {
    const character = await createCharacter([key]);
    let accessed!: () => void;
    let resume!: () => void;
    const accessRead = new Promise<void>(resolve => { accessed = resolve; });
    const revoked = new Promise<void>(resolve => { resume = resolve; });
    const write = withCharacterAccess(character.id, key, async tx => {
      accessed();
      await revoked;
      return tx.character.update({ where: { id: character.id }, data: { description: 'Must not commit' } });
    });
    const rejected = expect(write).rejects.toBeInstanceOf(CharacterMembershipConflictError);
    await accessRead;
    try {
      await prisma.character.update({ where: { id: character.id }, data: { apiKeys: ['other-owner'] } });
    } finally {
      resume();
    }
    await rejected;
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).description).toBe('Test');
  });

  it.each([['maneuvers', 'maneuver'], ['perks', 'perk'], ['stances', 'stance'], ['states', 'state']] as const)('connects/disconnects %s idempotently and maintains both sides', async (kind, model) => {
    const character = await createCharacter();
    const other = await createCharacter();
    const id = await createEntry(model);
    const response = await setCharacterMembership(character.id, kind, id, true, key);
    expect(response).toMatchObject({ changed: true, characterPatch: { [`${kind}Ids`]: [id], [kind]: [expect.objectContaining({ id })] } });
    expect(Object.keys(response.characterPatch!).sort()).toEqual([kind, `${kind}Ids`].sort());
    expect(await setCharacterMembership(character.id, kind, id, true, key)).toMatchObject({ changed: false });
    const saved = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(saved[`${kind}Ids`]).toEqual([id]);
    const entity = await (prisma[model] as typeof prisma.perk).findUniqueOrThrow({ where: { id } });
    expect(entity.characterIds).toEqual([character.id]);
    expect(entity.description).toBe('Test');
    expect((await prisma.character.findUniqueOrThrow({ where: { id: other.id } }))[`${kind}Ids`]).toEqual([]);
    expect(await setCharacterMembership(character.id, kind, id, false, key)).toMatchObject({ characterPatch: { [`${kind}Ids`]: [], [kind]: [] } });
    expect(await setCharacterMembership(character.id, kind, id, false, key)).toMatchObject({ changed: false });
    expect((await (prisma[model] as typeof prisma.perk).findUniqueOrThrow({ where: { id } })).characterIds).toEqual([]);
  });

  it('preserves two simultaneous additions and has no duplicates for simultaneous identical additions', async () => {
    const character = await createCharacter();
    const a = await createEntry('maneuver'), b = await createEntry('maneuver');
    await Promise.all([setCharacterMembership(character.id, 'maneuvers', a, true, key), setCharacterMembership(character.id, 'maneuvers', b, true, key)]);
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds.sort()).toEqual([a, b].sort());
    await Promise.all([setCharacterMembership(character.id, 'maneuvers', a, true, key), setCharacterMembership(character.id, 'maneuvers', a, true, key)]);
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds).toHaveLength(2);
  });

  it('does not let an old details form undo a new perk, including on legacy missing ID arrays', async () => {
    const character = await createCharacter();
    const snapshot = membershipSnapshot(character);
    const perk = await createEntry('perk');
    await setCharacterMembership(character.id, 'perks', perk, true, key);
    const data = { name: character.name, shortName: character.shortName, description: 'Changed', tags: [], perks: [] };
    await expectConflict(updateCharacterDetails(character.id, data, { expectedMembership: { perksIds: snapshot.perksIds }, apiKey: key }));
    const after = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(after.perksIds).toEqual([perk]);
    expect(after.description).toBe('Test');
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const parsed = toCharacter(raw);
    await updateCharacterDetails(character.id, { ...data, perks: parsed.perks }, { expectedMembership: { perksIds: raw.perksIds }, apiKey: key });
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).description).toBe('Changed');
  });

  it('rejects a stale combat form and rolls back nested entity edits', async () => {
    const character = await createCharacter();
    const a = await createEntry('maneuver'), b = await createEntry('maneuver');
    await setCharacterMembership(character.id, 'maneuvers', a, true, key);
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const parsed = toCharacter(raw);
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(raw);
    await setCharacterMembership(character.id, 'maneuvers', b, true, key);
    const combat = { ...parsed, maneuvers: parsed.maneuvers.map(item => ({ ...item, description: 'Should roll back' })) };
    await expectConflict(updateCharacterCombat(character.id, combat, { expectedMembership, apiKey: key }));
    expect((await prisma.maneuver.findUniqueOrThrow({ where: { id: a } })).description).toBe('Test');
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds).toHaveLength(2);
  });

  it('removes one grade-eight perk from 100, reattaches it and adds another without changing the other perks', async () => {
    const character = await createCharacter();
    const original = Array.from({ length: 100 }, (_, index) => ({
      id: `membership-test-${randomUUID()}`, name: index === 0 ? 'Większy Fechtunek' : `Atut ${randomUUID()}`,
      grade: 8, price: 1, description: 'Pozostaw bez zmian', tags: [], replaces: [], characterIds: [],
    }));
    const fortel = { ...original[0], id: `membership-test-${randomUUID()}`, name: 'Większy Fortel' };
    entityIds.push(...original.map(perk => perk.id), fortel.id);
    await prisma.perk.createMany({ data: [...original, fortel] });
    await prisma.character.update({ where: { id: character.id }, data: { perks: { connect: original.map(({ id }) => ({ id })) } } });

    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const remaining = toCharacter(raw).perks.filter(perk => perk.id !== original[0].id);
    const details = { name: character.name, shortName: character.shortName, description: 'Changed', tags: [], perks: remaining };
    await updateCharacterDetails(character.id, details, { expectedMembership: { perksIds: raw.perksIds }, apiKey: key });
    const afterRemoval = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(afterRemoval.perksIds).toHaveLength(99);
    expect(afterRemoval.perksIds).not.toContain(original[0].id);
    expect((await prisma.perk.findUniqueOrThrow({ where: { id: original[0].id } })).characterIds).not.toContain(character.id);

    await updateCharacterDetails(character.id, { ...details, perks: [...remaining, original[0], fortel] }, {
      expectedMembership: { perksIds: afterRemoval.perksIds }, apiKey: key,
    });
    const afterAddition = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(afterAddition.perksIds).toHaveLength(101);
    expect(afterAddition.perksIds).toEqual(expect.arrayContaining([original[0].id, fortel.id]));
    const savedPerks = await prisma.perk.findMany({ where: { id: { in: [...original.map(perk => perk.id), fortel.id] } } });
    for (const perk of savedPerks) {
      expect(perk.description).toBe('Pozostaw bez zmian');
      expect(perk.characterIds).toContain(character.id);
    }

    const edited = remaining.map((perk, index) => index === 0 ? { ...perk, description: 'Rzeczywista edycja' } : perk);
    await updateCharacterDetails(character.id, { ...details, perks: [...edited, original[0], fortel] }, {
      expectedMembership: { perksIds: afterAddition.perksIds }, apiKey: key,
    });
    expect((await prisma.perk.findUniqueOrThrow({ where: { id: remaining[0].id } })).description).toBe('Rzeczywista edycja');
    expect((await prisma.perk.findUniqueOrThrow({ where: { id: remaining[1].id } })).description).toBe('Pozostaw bez zmian');
  });

  it('enforces visibility and does not turn unknown additions into dangling links', async () => {
    const hidden = await createCharacter(['another-key']);
    const id = await createEntry('perk');
    await expect(setCharacterMembership(hidden.id, 'perks', id, true, key)).rejects.toMatchObject({ status: 404 });
    await expect(setCharacterMembership(hidden.id, 'perks', id, true, 'another-key')).resolves.toMatchObject({ changed: true });
    const visible = await createCharacter();
    await expect(setCharacterMembership(visible.id, 'perks', 'missing', true, key)).rejects.toMatchObject({ status: 404 });
    await expect(setCharacterMembership(visible.id, 'perks', 'missing', false, key)).resolves.toMatchObject({ changed: false });
  });

  it.each(['maneuvers', 'stances', 'states'] as const)('removes one of many %s and preserves a genuine edit and simulation fields', async kind => {
    const character = await createCharacter();
    const entries = Array.from({ length: kind === 'maneuvers' ? 100 : 20 }, () => ({
      id: `membership-test-${randomUUID()}`, name: `Test ${randomUUID()}`, grade: 1, price: 1, description: 'Test',
      tags: [], replaces: [], characterIds: [], effects: [{ type: 'test' }], simulatable: false, unsupportedReason: 'Keep',
    }));
    entityIds.push(...entries.map(entry => entry.id));
    if (kind === 'maneuvers') await prisma.maneuver.createMany({ data: entries.map(entry => ({ ...entry, castTime: 'Standardowa', cooldown: 0 })) });
    else if (kind === 'stances') await prisma.stance.createMany({ data: entries });
    else await prisma.state.createMany({ data: entries });
    await prisma.character.update({ where: { id: character.id }, data: { [kind]: { connect: entries.map(({ id }) => ({ id })) } } });
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(raw);
    // The real character form strips Combat Lab metadata from its DTO.
    const parsed = toCharacter(raw);
    const incoming = parsed[kind].filter(entry => entry.id !== entries[0].id).map(({ effects: _effects, simulatable: _sim, unsupportedReason: _reason, ...entry }) => entry);
    await updateCharacterCombat(character.id, { ...parsed, [kind]: incoming }, { expectedMembership, apiKey: key });
    const after = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    expect(after[`${kind}Ids`]).toHaveLength(entries.length - 1);
    expect(after[`${kind}Ids`]).not.toContain(entries[0].id);
    const getEntry = (id: string) => kind === 'maneuvers' ? prisma.maneuver.findUniqueOrThrow({ where: { id } })
      : kind === 'stances' ? prisma.stance.findUniqueOrThrow({ where: { id } }) : prisma.state.findUniqueOrThrow({ where: { id } });
    const removed = await getEntry(entries[0].id);
    expect(removed.characterIds).not.toContain(character.id);
    const { perksIds: _afterPerks, ...nextExpected } = membershipSnapshot(after);
    const edited = incoming.map((entry, index) => index === 0 ? { ...entry, description: 'Changed' } : entry);
    await updateCharacterCombat(character.id, { ...toCharacter(after), [kind]: edited }, { expectedMembership: nextExpected, apiKey: key });
    const saved = await getEntry(incoming[0].id);
    expect(saved.description).toBe('Changed');
    expect(saved.effects).toEqual([{ type: 'test' }]);
    expect(saved.simulatable).toBe(false);
    expect(saved.unsupportedReason).toBe('Keep');
  });

  it('preserves a spell in another power, saves its cost edit, and detaches it only after the final reference', async () => {
    const character = await createCharacter();
    const spell = { ...defaultSpell, id: `membership-test-${randomUUID()}`, name: `Spell ${randomUUID()}` };
    const specId = `membership-test-${randomUUID()}`;
    entityIds.push(spell.id, specId);
    await prisma.spell.create({ data: { ...toSpellPersistenceModel(spell), replaces: [], characterIds: [] } });
    await prisma.powerSpecification.create({ data: { id: specId, name: `Spec ${randomUUID()}`, description: '', tags: [], offenses: [], characterIds: [] } });
    const powers = [1, 2].map(index => ({ ...defaultPower, id: `power-${index}`, powerSpecificationId: specId, spells: [spell] }));
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(raw);
    await updateCharacterCombat(character.id, { ...toCharacter(raw), powers }, { expectedMembership, apiKey: key });
    const connected = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    expect(connected.spellsIds).toEqual([spell.id]);
    expect(connected.powerSpecificationsIds).toEqual([specId]);
    const { perksIds: _sharedPerks, ...sharedExpected } = membershipSnapshot(connected);
    const shared = toCharacter(connected);
    await updateCharacterCombat(character.id, { ...shared, powers: shared.powers.map((power, index) => ({ ...power,
      spells: power.spells.map(item => index === 0 ? { ...item, cost: { ...item.cost, baseCost: 27 } } : item),
    })) }, { expectedMembership: sharedExpected, apiKey: key });
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spell.id } })).costBase).toBe(27);
    const next = toCharacter(connected);
    const updatedPowers = next.powers.map((power, index) => ({ ...power, spells: index === 0 ? []
      : power.spells.map(item => ({ ...item, cost: { ...item.cost, baseCost: 31 } })) }));
    const { perksIds: _nextPerks, ...nextExpected } = membershipSnapshot(connected);
    await updateCharacterCombat(character.id, { ...next, powers: updatedPowers }, { expectedMembership: nextExpected, apiKey: key });
    const partial = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    expect(partial.spellsIds).toEqual([spell.id]);
    expect(partial.powers.map(power => power.spellsIds)).toEqual([[], [spell.id]]);
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spell.id } })).costBase).toBe(31);
    const { perksIds: _finalPerks, ...finalExpected } = membershipSnapshot(partial);
    await updateCharacterCombat(character.id, { ...toCharacter(partial), powers: updatedPowers.map(power => ({ ...power, spells: [] })) }, { expectedMembership: finalExpected, apiKey: key });
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).spellsIds).toEqual([]);
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spell.id } })).characterIds).not.toContain(character.id);
  });

  it('removes a dangling relation even when its compendium record no longer exists', async () => {
    const character = await createCharacter();
    await prisma.character.update({ where: { id: character.id }, data: { maneuversIds: ['deleted-entry'] } });
    await setCharacterMembership(character.id, 'maneuvers', 'deleted-entry', false, key);
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds).toEqual([]);
  });

  it('persists cleared optional maneuver and spell cooldowns after reloading the character', async () => {
    const character = await createCharacter();
    const maneuverId = await createEntry('maneuver');
    await prisma.maneuver.update({ where: { id: maneuverId }, data: { cooldown: 3 } });
    await setCharacterMembership(character.id, 'maneuvers', maneuverId, true, key);
    const spellId = `membership-test-${randomUUID()}`, specId = `membership-test-${randomUUID()}`;
    entityIds.push(spellId, specId);
    const spell = { ...defaultSpell, id: spellId, cooldown: 3 };
    await prisma.spell.create({ data: { ...toSpellPersistenceModel(spell), structuredRequirements: [], replaces: [], characterIds: [] } });
    await prisma.powerSpecification.create({ data: { id: specId, name: 'Spec testowa', description: '', tags: [], offenses: [], characterIds: [] } });
    const before = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const { perksIds: _beforePerks, ...beforeSnapshot } = membershipSnapshot(before);
    await updateCharacterCombat(character.id, { ...toCharacter(before), powers: [{ ...defaultPower, id: 'power', powerSpecificationId: specId, spells: [spell] }] }, { expectedMembership: beforeSnapshot, apiKey: key });
    const loaded = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const current = toCharacter(loaded);
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(loaded);
    await updateCharacterCombat(character.id, { ...current,
      maneuvers: current.maneuvers.map(item => ({ ...item, cooldown: undefined })),
      powers: current.powers.map(power => ({ ...power, spells: power.spells.map(item => ({ ...item, cooldown: undefined })) })),
    }, { expectedMembership, apiKey: key });
    const reloaded = toCharacter(await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations }));
    expect(reloaded.maneuvers[0].cooldown).toBe(0);
    expect(reloaded.powers[0].spells[0].cooldown).toBe(0);
    expect((await prisma.maneuver.findUniqueOrThrow({ where: { id: maneuverId } })).cooldown).toBe(0);
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spellId } })).cooldown).toBe(0);
  });

  it('validates direct compendium requests and persists explicit zero through the real API handler', async () => {
    const { NextRequest } = await import('next/server');
    const { POST } = await import('@/app/api/maneuvers/route');
    const { PUT } = await import('@/app/api/maneuvers/[id]/route');
    const id = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
    entityIds.push(id);
    const body = { id, name: 'Test walidacji liczb', description: '', grade: 0, price: 0, castTime: 'Standardowa', tags: [], replaces: [],
      structuredRequirements: [{ kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 0 }] };
    const request = (method: string, data: unknown) => new NextRequest(`http://localhost/api/maneuvers/${id}`, { method,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const created = await POST(request('POST', body));
    expect(created.status).toBe(201);
    expect(await prisma.maneuver.findUniqueOrThrow({ where: { id } })).toMatchObject({ grade: 0, price: 0, cooldown: 0 });
    const context = { params: Promise.resolve({ id }) };
    const invalid = await PUT(request('PUT', { ...body, price: '' }), context);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ message: 'Uzupełnij pole' });
    await prisma.maneuver.update({ where: { id }, data: { cooldown: 3 } });
    const valid = await PUT(request('PUT', { ...body, price: '0' }), context);
    expect(valid.status).toBe(200);
    expect(await prisma.maneuver.findUniqueOrThrow({ where: { id } })).toMatchObject({ grade: 0, price: 0, cooldown: 0 });
  });

  it('enforces the limit atomically for two requests competing for the last slot', async () => {
    const character = await createCharacter();
    // Existing scalar IDs need not have hydrated relation rows to count towards capacity.
    await prisma.character.update({ where: { id: character.id }, data: { stancesIds: Array.from({ length: 19 }, (_, i) => `existing-${i}`) } });
    const a = await createEntry('stance'), b = await createEntry('stance');
    const results = await Promise.allSettled([setCharacterMembership(character.id, 'stances', a, true, key), setCharacterMembership(character.id, 'stances', b, true, key)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { status: 422 } });
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).stancesIds).toHaveLength(20);
  });
});
