import { readCreation } from '@/application/mcp/readCreation';
import { CreateDefaultShield } from '@/domain/characters/equipment/Shield';
import { CreateDefaultSpell } from '@/domain/characters/combat/Power';
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import { ulid } from 'ulid';
import { auditCharacter } from './sheetAudit';

import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
vi.unmock('ulid');
const testUrl = vi.hoisted(() => {
  const url = process.env.MCP_TEST_DATABASE_URL;
  if (url) {
    const location = new URL(url);
    if (location.protocol !== 'mongodb:' || location.hostname !== '127.0.0.1' || !/^\/cedrus_data_change_test_[a-f0-9]{32}$/.test(location.pathname))
      throw new Error('MCP integration requires an isolated local replica set.');
    process.env.DATABASE_CONNECTION_STRING = url;
  }
  return url;
});
import prisma from '@/lib/prisma';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { createInput, editInput } from '@/domain/mcp/writeContracts';
import { previewCreation } from './create';
import { applyEdit, previewEdit, readEdit } from './edit';
import { acceptAiCharacterDraft } from '@/application/ai-character-generation/acceptAiCharacterDraft';
import { readEntry } from './read';

vi.mock('@/infrastructure/ai-character-generation/createCharacterGenerationProvider', () => ({
  createCharacterGenerationProvider() { throw new Error('MCP invoked an application provider'); },
}));

describe.skipIf(!testUrl)('MCP character lifecycle on MongoDB', () => {
  async function fixture() {
    const key = 'mcp-fixture-' + randomUUID();
    const draft = createPendingDraft();
    const preview = await previewCreation(createInput.parse({ brief: draft.request, requestId: 'create',
      proposal: { ...draft.proposal, header: { ...draft.proposal!.header, name: key, shortName: key.slice(-12) } } }), key);
    const save = () => acceptAiCharacterDraft({ draftId: preview.changeId, apiKey: key, reviewedRevision: preview.revision });
    const characterId = await save();
    return { key, preview, characterId, save };
  }
  it('creates once, applies requested visibility and scopes lookup by key', async () => {
    const { key, preview, characterId, save } = await fixture();
    expect(await save()).toBe(characterId);
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId }, select: { apiKeys: true } })).toEqual({ apiKeys: [key] });
    await expect(readCreation(preview.changeId, 'other')).rejects.toMatchObject({ status: 404 });
    await expect(readEntry({ kind: 'character', id: characterId }, 'other')).rejects.toMatchObject({ status: 404 });
  });
  it('preserves unrelated changes, rejects a stale edit and supports retry', async () => {
    const { key, characterId } = await fixture();
    const input = editInput.parse({ requestId: 'edit', characterId, operations: [
      { op: 'description', value: 'Updated description.' }, { op: 'statistic', statistic: 'dexterity', component: 'value', value: 4 },
    ] });
    const edit = await previewEdit(input, key);
    await prisma.character.update({ where: { id: characterId }, data: { description: 'Edited in UI.', tags: ['test-ui'] } });
    await expect(applyEdit(edit.changeId, edit.revision, key)).rejects.toMatchObject({ status: 409 });
    const refreshed = await previewEdit({ ...input, expectedRevision: edit.revision }, key);
    await applyEdit(refreshed.changeId, refreshed.revision, key);
    expect((await applyEdit(refreshed.changeId, refreshed.revision, key)).status).toBe('accepted');
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId } })).toMatchObject({
      description: 'Updated description.', tags: ['test-ui'], characteristics: { dexterity: { value: 4 } },
    });
    await expect(readEdit(edit.changeId, 'other')).rejects.toMatchObject({ status: 404 });
  });
  it('commits compound membership edits and rejects removed catalog entries atomically', async () => {
    const { key, characterId } = await fixture();
    const addManeuver = () => prisma.maneuver.create({ data: {
      name: 'MCP fixture ' + randomUUID(), description: 'Fixture maneuver.', grade: 1,
      price: 1, tags: [], characterIds: [], castTime: 'Standardowa', cooldown: 0,
    } });
    const maneuver = await addManeuver();
    const other = await addManeuver();
    const preview = (entityId: string, description: string) => previewEdit(editInput.parse({
      requestId: randomUUID(), characterId, operations: [
        { op: 'description', value: description }, { op: 'membership', kind: 'maneuvers', entityId, present: true },
      ],
    }), key);
    const edit = await preview(maneuver.id, 'First reviewed description.');
    await applyEdit(edit.changeId, edit.revision, key);
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId } })).toMatchObject({
      description: 'First reviewed description.', maneuversIds: [maneuver.id],
    });
    const stale = await preview(other.id, 'Uncommitted description.');
    await prisma.maneuver.delete({ where: { id: other.id } });
    await expect(applyEdit(stale.changeId, stale.revision, key)).rejects.toMatchObject({ status: 409 });
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId } })).toMatchObject({
      description: 'First reviewed description.', maneuversIds: [maneuver.id],
    });
  });

  it('rechecks gear, preserves a sibling defense field and commits both sides of a relation only once', async () => {
    const {key,characterId} = await fixture();
    const shield = await prisma.shield.create({data:{...CreateDefaultShield(),name:'MCP shield '+randomUUID(),block:9,characterIds:[]}});
    const initial = await prisma.character.findUniqueOrThrow({where:{id:characterId}});
    const id = initial.defaultDefenseId!;
    const input = editInput.parse({requestId:'gear',characterId,operations:[
      {op:'gear',group:'shields',entityId:shield.id,present:true},{op:'patchItem',group:'defenses',id,fields:{block:9}}]});
    const preview = await previewEdit(input,key);
    await prisma.shield.update({where:{id:shield.id},data:{block:10}});
    await expect(applyEdit(preview.changeId,preview.revision,key)).rejects.toMatchObject({status:409});
    expect((await prisma.character.findUniqueOrThrow({where:{id:characterId}})).shieldsIds).toEqual([]);
    const reviewed = await previewEdit({...input,expectedRevision:preview.revision},key);
    await prisma.character.update({where:{id:characterId},data:{defenses:initial.defenses.map(d=>({...d,dodge:8}))}});
    const saves = await Promise.allSettled([applyEdit(reviewed.changeId,reviewed.revision,key),applyEdit(reviewed.changeId,reviewed.revision,key)]);
    expect(saves.some(s=>s.status==='fulfilled')).toBe(true);
    expect((await applyEdit(reviewed.changeId,reviewed.revision,key)).status).toBe('accepted');
    expect(await prisma.character.findUniqueOrThrow({where:{id:characterId}})).toMatchObject({shieldsIds:[shield.id],defenses:[{block:9,dodge:8}]});
    expect(await prisma.shield.findUniqueOrThrow({where:{id:shield.id}})).toMatchObject({block:10,characterIds:[characterId]});
    await expect(auditCharacter({characterId},'another-key')).rejects.toMatchObject({status:404});
    await expect(readEntry({kind:'character',id:characterId,detail:'full'},'another-key')).rejects.toMatchObject({status:404});
  });

  it('keeps shared spell and specification backlinks across power edits',async()=>{
    const {key,characterId} = await fixture();
    const spec = await prisma.powerSpecification.create({data:{name:randomUUID(),description:'Fixture',tags:[],offenses:[],characterIds:[]}});
    const spell = await prisma.spell.create({data:{...toSpellPersistenceModel(CreateDefaultSpell()),name:randomUUID(),characterIds:[]}});
    const [a,b] = [ulid(),ulid()];
    const changes = [a,b].flatMap(id=>[
      {op:'addItem',group:'powers',id,fields:{name:'Fixture power',level:4,powerSpecificationId:spec.id}},
      {op:'powerSpell',powerId:id,spellId:spell.id,present:true}]);
    const save = async (operations:unknown[])=>{
      const preview = await previewEdit(editInput.parse({characterId,requestId:randomUUID(),operations}),key);
      return applyEdit(preview.changeId,preview.revision,key);
    };
    const added = await save(changes);
    expect((await applyEdit(added.changeId,added.revision,key)).status).toBe('accepted');
    await save([{op:'removeItem',group:'powers',id:a},{op:'patchItem',group:'powers',id:b,fields:{essence:21}}]);
    const card = await readEntry({kind:'character',id:characterId,detail:'full',sections:['combat']},key);
    expect(card).toMatchObject({combat:{powers:[{id:b,level:4,essence:21,spellIds:[spell.id],powerSpecificationId:spec.id}]}});
    expect((await prisma.spell.findUniqueOrThrow({where:{id:spell.id}})).characterIds).toEqual([characterId]);
    await save([{op:'removeItem',group:'powers',id:b}]);
    expect((await prisma.spell.findUniqueOrThrow({where:{id:spell.id}})).characterIds).toEqual([]);
    expect((await prisma.powerSpecification.findUniqueOrThrow({where:{id:spec.id}})).characterIds).toEqual([]);
  });

  it('persists a profile and its effective value, rejecting a later invalid operation atomically',async()=>{
    const {key,characterId} = await fixture();
    const id=ulid();
    const operations = [{op:'addItem',group:'buffProfiles',id,fields:{name:'Cover','defense.block':2}},{op:'activateProfile',group:'buffProfiles',id,active:true}];
    const preview = await previewEdit(editInput.parse({requestId:'buff',characterId,operations}),key);
    await applyEdit(preview.changeId,preview.revision,key);
    const before = await prisma.character.findUniqueOrThrow({where:{id:characterId}});
    const full = await readEntry({kind:'character',id:characterId,detail:'full',sections:['combat']},key);
    expect(full).toMatchObject({combat:{base:{defenses:[{block:before.defenses[0].block}]},effective:{defenses:[{block:before.defenses[0].block+2}]}}});
    await expect(previewEdit(editInput.parse({requestId:'invalid',characterId,operations:[
      {op:'activateProfile',group:'buffProfiles',id,active:false},{op:'health',field:'vitality',value:-10}]}),key)).rejects.toThrow();
    expect((await prisma.character.findUniqueOrThrow({where:{id:characterId}})).activeBuffProfileIds).toEqual([id]);
  });

});
