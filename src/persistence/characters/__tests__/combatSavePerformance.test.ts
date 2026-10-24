import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { membershipSnapshot } from '@/domain/characters/characterMembership';
import { defaultPower, defaultSpell } from '@/domain/characters/combat/Power';
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import { changedRelations } from '../changedRelations';
import { CharacterValidationError } from '../characterErrors';
import type { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), character: vi.fn(), update: vi.fn(),
  maneuver: vi.fn(), stance: vi.fn(), state: vi.fn(), spell: vi.fn() }));
const tx = { character: { findUnique: mocks.character, update: mocks.update },
  maneuver: { findMany: mocks.maneuver }, stance: { findMany: mocks.stance },
  state: { findMany: mocks.state }, spell: { findMany: mocks.spell } };
vi.mock('@/lib/prisma', () => ({ default: { $transaction: mocks.transaction } }));
vi.mock('@/lib/env', () => ({ adminApiKeys: ['key'] }));
import { updateCharacterCombat } from '../charactersRepository';

const base = () => ({ id: 'existing', name: 'Test', grade: 1, price: 1, description: 'Opis', tags: [], castTime: 'Standardowa' as const, cooldown: 0 });
const combat = (): CombatDto => ({ ...CreateEmptyCharacter({ name: 'Test', shortName: 'Test', description: 'Test', tags: [] }),
  maneuvers: [], stances: [], states: [], powers: [] });
const guard = (snapshot = membershipSnapshot({})) => ({ expectedMembership: snapshot, apiKey: 'key' });
const data = () => mocks.update.mock.calls[0][0].data;

describe('combat relation write performance', () => {
  beforeEach(() => {
    mocks.transaction.mockReset().mockImplementation((write: (db: typeof tx) => unknown) => write(tx));
    mocks.character.mockReset().mockResolvedValue({ ...membershipSnapshot({}), raceId: null, apiKeys: [] });
    mocks.update.mockReset().mockResolvedValue(membershipSnapshot({}));
    for (const model of [mocks.maneuver, mocks.stance, mocks.state, mocks.spell]) model.mockReset().mockResolvedValue([]);
  });

  it.each(['maneuvers', 'stances', 'states'] as const)('removes one %s without rewriting the remaining repertoire', async kind => {
    const entries = Array.from({ length: kind === 'maneuvers' ? 100 : 20 }, (_, i) => ({ ...base(), id: `entry-${i}` }));
    const snapshot = membershipSnapshot({ [`${kind}Ids`]: entries.map(entry => entry.id) });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    const model = kind === 'maneuvers' ? mocks.maneuver : kind === 'stances' ? mocks.stance : mocks.state;
    model.mockResolvedValue(entries.slice(1));
    await updateCharacterCombat('character', { ...combat(), [kind]: entries.slice(1) }, guard(snapshot));
    expect(data()[kind]).toEqual({ create: [], update: [], connect: [], disconnect: [{ id: 'entry-0' }] });
    expect(mocks.character).toHaveBeenCalledOnce();
    for (const other of ['maneuvers', 'stances', 'states', 'spells', 'powerSpecifications']) if (other !== kind) expect(data()).not.toHaveProperty(other);
  });

  it.each(['maneuvers', 'stances', 'states'] as const)('connects a new library %s entry and skips unchanged ones', async kind => {
    const original = base(), added = { ...base(), id: 'new' };
    const snapshot = membershipSnapshot({ [`${kind}Ids`]: [original.id] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    (kind === 'maneuvers' ? mocks.maneuver : kind === 'stances' ? mocks.stance : mocks.state).mockResolvedValue([original, added]);
    await updateCharacterCombat('character', { ...combat(), [kind]: [original, added] }, guard(snapshot));
    expect(data()[kind]).toEqual({ create: [], update: [], connect: [{ id: 'new' }], disconnect: [] });
  });

  it('preserves omitted JSON effects while keeping real cast time and cooldown edits', async () => {
    const snapshot = membershipSnapshot({ maneuversIds: ['existing'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.maneuver.mockResolvedValue([{ ...base(), effects: [{ type: 'test', value: 2 }] }]);
    await updateCharacterCombat('character', { ...combat(), maneuvers: [base()] }, guard(snapshot));
    expect(data()).not.toHaveProperty('maneuvers');
    mocks.update.mockClear();
    await updateCharacterCombat('character', { ...combat(), maneuvers: [{ ...base(), castTime: 'Pełnorundowa', cooldown: 2 }] }, guard(snapshot));
    expect(data().maneuvers.update).toHaveLength(1);
    expect(data().maneuvers.update[0].data).toMatchObject({ castTime: 'Pełnorundowa', cooldown: 2 });
  });

  it('persists a cleared maneuver cooldown and avoids rewriting it on the next save', async () => {
    const snapshot = membershipSnapshot({ maneuversIds: ['existing'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.maneuver.mockResolvedValue([{ ...base(), cooldown: 3 }]);
    const payload = { ...combat(), maneuvers: [{ ...base(), cooldown: undefined }] };
    await updateCharacterCombat('character', payload, guard(snapshot));
    expect(data().maneuvers.update[0].data.cooldown).toBe(0);
    mocks.update.mockClear();
    mocks.maneuver.mockResolvedValue([{ ...base(), cooldown: 0 }]);
    await updateCharacterCombat('character', payload, guard(snapshot));
    expect(data()).not.toHaveProperty('maneuvers');
  });

  it('persists a cleared spell cooldown through its power', async () => {
    const spell = { ...defaultSpell, id: 'spell', cooldown: undefined };
    const snapshot = membershipSnapshot({ spellsIds: ['spell'], powerSpecificationsIds: ['spec'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.spell.mockResolvedValue([toSpellPersistenceModel({ ...spell, cooldown: 3 })]);
    await updateCharacterCombat('character', { ...combat(), powers: [{ ...defaultPower, id: 'power', powerSpecificationId: 'spec', spells: [spell] }] }, guard(snapshot));
    expect(data().spells.update[0].data.cooldown).toBe(0);
  });

  it('keeps a spell linked while another power still references it, without repeated updates/connects', async () => {
    const spell = { ...defaultSpell, id: 'spell' };
    const power = { ...defaultPower, id: 'power', powerSpecificationId: 'spec', spells: [spell] };
    const snapshot = membershipSnapshot({ spellsIds: ['spell'], powerSpecificationsIds: ['spec'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.spell.mockResolvedValue([toSpellPersistenceModel(spell)]);
    await updateCharacterCombat('character', { ...combat(), powers: [power, { ...power, id: 'other' }] }, guard(snapshot));
    expect(data()).not.toHaveProperty('spells');
    expect(data()).not.toHaveProperty('powerSpecifications');
    expect(data().powers.map((item: { spellsIds: string[] }) => item.spellsIds)).toEqual([['spell'], ['spell']]);
    mocks.update.mockClear();
    await updateCharacterCombat('character', { ...combat(), powers: [{ ...power, spells: [] }, { ...power, id: 'other' }] }, guard(snapshot));
    expect(data()).not.toHaveProperty('spells');
  });

  it('disconnects a spell after its last power reference is removed', async () => {
    const snapshot = membershipSnapshot({ spellsIds: ['spell'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    await updateCharacterCombat('character', combat(), guard(snapshot));
    expect(data().spells).toEqual({ create: [], update: [], connect: [], disconnect: [{ id: 'spell' }] });
    expect(mocks.spell).not.toHaveBeenCalled();
  });

  it('deduplicates a newly connected spell and power specification shared by two powers', async () => {
    const spell = { ...defaultSpell, id: 'spell' };
    const power = { ...defaultPower, id: 'power', powerSpecificationId: 'spec', spells: [spell] };
    mocks.spell.mockResolvedValue([toSpellPersistenceModel(spell)]);
    await updateCharacterCombat('character', { ...combat(), powers: [power, { ...power, id: 'other' }] }, guard());
    expect(data().spells).toEqual({ create: [], update: [], disconnect: [], connect: [{ id: 'spell' }] });
    expect(data().powerSpecifications).toEqual({ connect: [{ id: 'spec' }] });
  });

  it('normalizes legacy spell cost defaults but writes an actual cost change', async () => {
    const spell = { ...defaultSpell, id: 'spell' };
    const power = { ...defaultPower, id: 'power', powerSpecificationId: 'spec', spells: [spell] };
    const snapshot = membershipSnapshot({ spellsIds: ['spell'], powerSpecificationsIds: ['spec'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.spell.mockResolvedValue([{ ...base(), ...toSpellPersistenceModel(spell), costBase: null, costScalingMode: null, costScalingValue: null, costRounding: null }]);
    await updateCharacterCombat('character', { ...combat(), powers: [power] }, guard(snapshot));
    expect(data()).not.toHaveProperty('spells');
    mocks.update.mockClear();
    await updateCharacterCombat('character', { ...combat(), powers: [{ ...power, spells: [{ ...spell, cost: { ...spell.cost, baseCost: 23 } }] }] }, guard(snapshot));
    expect(data().spells.update[0].data.costBase).toBe(23);
  });

  it('creates a shared custom spell only once', async () => {
    const spell = { ...defaultSpell, id: 'custom' };
    const power = { ...defaultPower, id: 'power', powerSpecificationId: 'spec', spells: [spell] };
    await updateCharacterCombat('character', { ...combat(), powers: [power, { ...power, id: 'other' }] }, guard());
    expect(data().spells.create).toEqual([toSpellPersistenceModel(spell)]);
    expect(data().spells.connect).toEqual([]);
  });

  it.each([0, 1])('retains an edit made in power %i when another copy of the shared spell is unchanged', async editedIndex => {
    const spell = { ...defaultSpell, id: 'shared' };
    const snapshot = membershipSnapshot({ spellsIds: ['shared'], powerSpecificationsIds: ['spec'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.spell.mockResolvedValue([toSpellPersistenceModel(spell)]);
    const powers = [0, 1].map(index => ({ ...defaultPower, id: `power-${index}`, powerSpecificationId: 'spec',
      spells: [{ ...spell, cost: { ...spell.cost, baseCost: index === editedIndex ? 23 : spell.cost.baseCost } }] }));
    await updateCharacterCombat('character', { ...combat(), powers }, guard(snapshot));
    expect(data().spells.update).toHaveLength(1);
    expect(data().spells.update[0].data.costBase).toBe(23);
  });

  it('rejects conflicting edits of one shared spell instead of silently losing one of them', async () => {
    const spell = { ...defaultSpell, id: 'shared' };
    const snapshot = membershipSnapshot({ spellsIds: ['shared'], powerSpecificationsIds: ['spec'] });
    mocks.character.mockResolvedValue({ ...snapshot, raceId: null, apiKeys: [] });
    mocks.spell.mockResolvedValue([toSpellPersistenceModel(spell)]);
    const powers = [23, 24].map(cost => ({ ...defaultPower, id: `power-${cost}`, powerSpecificationId: 'spec',
      spells: [{ ...spell, cost: { ...spell.cost, baseCost: cost } }] }));
    await expect(updateCharacterCombat('character', { ...combat(), powers }, guard(snapshot))).rejects.toBeInstanceOf(CharacterValidationError);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('compares nested JSON independently of object key order, but retains explicit clears and changes', () => {
    const stored = { id: 'id', effects: [{ type: 'test', value: 2 }], structuredRequirements: null, replaces: [] };
    expect(changedRelations(['id'], [{ id: 'id', effects: [{ value: 2, type: 'test' }], structuredRequirements: [], replaces: [] }], [stored]).payload).toBeUndefined();
    expect(changedRelations(['id'], [{ id: 'id', effects: [] }], [stored]).counts.update).toBe(1);
    expect(changedRelations(['id'], [{ id: 'id', effects: [{ type: 'test', value: 3 }] }], [stored]).counts.update).toBe(1);
    expect(changedRelations(['id'], [{ id: 'id', effects: undefined }], [stored]).payload).toBeUndefined();
  });
});
