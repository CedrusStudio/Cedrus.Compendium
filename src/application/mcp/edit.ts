import 'server-only';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import { formatRequirement } from '@/domain/requirements/formatRequirement';
import prisma from '@/lib/prisma';
import { hashApiKey } from '@/lib/apiKeyHash';
import { aiCharacterGenerationSettings } from '@/lib/env';
import { editInput, editOperation, type EditOperation } from '@/domain/mcp/writeContracts';
import { membershipLimits } from '@/domain/characters/characterMembership';
import { isCharacterVisible } from '@/persistence/characterVisibility';
import { characterTransactionOptions } from '@/persistence/characters/characterTransactionOptions';
import { findMembershipEntity, setMembershipInTransaction } from '@/persistence/characters/characterMembershipRepository';
import { characteristicsSchema } from '@/persistence/schemas/characters/statistics/characteristicSchema';
import { attributesSchema } from '@/persistence/schemas/characters/statistics/attributeSchema';
import { statisticSchema } from '@/persistence/schemas/characters/statistics/statisticSchema';
import { tagsSchema } from '@/persistence/schemas/tagSchema';
import { changeId, digest, jsonValue } from '@/persistence/mcp/changeIdentity';
import { CompendiumToolError, unavailable } from './errors';

async function visibleCard(tx: Prisma.TransactionClient, id: string, key: string) {
  const card = await tx.character.findUnique({ where: { id }, select: { id: true, name: true, apiKeys: true,
    tags: true, description: true, characteristics: true, attributes: true,
    maneuversIds: true, perksIds: true, stancesIds: true, statesIds: true,
    buffProfiles: true, stanceModifierProfiles: true, stateModifierProfiles: true, otherModifierProfiles: true } });
  if (!card || !isCharacterVisible(card.apiKeys, key)) return unavailable();
  return card;
}

type Card = Awaited<ReturnType<typeof visibleCard>>;
type Difference = { field: string; label: string; grade?: number; requirements?: string[]; before: string | string[] | number | boolean; after: string | string[] | number | boolean };

async function planOperations(tx: Prisma.TransactionClient, card: Card, operations: EditOperation[]) {
  const differences: Difference[] = [];
  const update: Prisma.CharacterUpdateInput = {};
  for (const op of operations) {
    switch (op.op) {
      case 'description':
      case 'tags':
        differences.push({ field: op.op, label: op.op, before: card[op.op], after: op.value });
        if (op.op === 'tags') update.tags = tagsSchema.parse(op.value);
        else update.description = op.value;
        break;
      case 'statistic': {
        const characteristic = characteristicsSchema.keyof().safeParse(op.statistic);
        const attribute = attributesSchema.keyof().safeParse(op.statistic);
        const cell = characteristic.success ? card.characteristics[characteristic.data] : attribute.success ? card.attributes[attribute.data] : undefined;
        if (!cell) throw new CompendiumToolError(400, 'Unknown statistic: ' + op.statistic);
        const next = statisticSchema.parse({ ...cell, [op.component]: op.value });
        const field = op.statistic + '.' + op.component;
        differences.push({ field, label: field, before: cell[op.component], after: op.value });
        if (characteristic.success) {
          card.characteristics[characteristic.data] = next;
          update.characteristics = card.characteristics;
        } else if (attribute.success) {
          card.attributes[attribute.data] = next;
          update.attributes = card.attributes;
        }
        break;
      }
      case 'membership': {
        const entity = await findMembershipEntity(tx, op.kind, op.entityId);
        if (!entity) return unavailable();
        const ids = new Set(card[`${op.kind}Ids`]);
        const before = ids.has(op.entityId);
        if (op.present) ids.add(op.entityId); else ids.delete(op.entityId);
        if (ids.size > membershipLimits[op.kind]) throw new CompendiumToolError(422, 'Repertoire limit exceeded: ' + op.kind);
        if (!op.present && (op.kind === 'stances' || op.kind === 'states')) {
          const linked = [...card.buffProfiles, ...card.stanceModifierProfiles, ...card.stateModifierProfiles, ...card.otherModifierProfiles];
          if (linked.some(profile => profile.linkedEntityId === op.entityId)) throw new CompendiumToolError(422, 'A modifier profile uses this entry.');
        }
        card[`${op.kind}Ids`] = [...ids];
        differences.push({ field: op.kind + '/' + op.entityId, label: entity.name, grade: entity.grade,
          requirements: readStructuredRequirements(entity).map(formatRequirement), before, after: op.present });
        break;
      }
    }
  }
  if (new Set(differences.map(item => item.field)).size !== differences.length)
    throw new CompendiumToolError(400, 'Change each field only once per preview.');
  return { update, differences };
}

type StoredEdit = Prisma.McpCharacterEditGetPayload<object>;
function summary(edit: StoredEdit) {
  return { changeId: edit.id, revision: edit.revision, characterId: edit.characterId, differences: edit.differences,
    expiresAt: edit.expiresAt, status: edit.acceptedAt ? 'accepted' : edit.expiresAt <= new Date() ? 'expired' : 'pending',
    href: '/characters/' + encodeURIComponent(edit.characterId) };
}
export async function readEdit(id: string, key: string) {
  const edit = await prisma.mcpCharacterEdit.findFirst({ where: { id, apiKeyHash: hashApiKey(key) } });
  if (!edit) return unavailable();
  await visibleCard(prisma, edit.characterId, key);
  return summary(edit);
}

export async function previewEdit(input: z.infer<typeof editInput>, key: string) {
  const owner = hashApiKey(key), id = changeId('edit', owner, input.requestId);
  return prisma.$transaction(async tx => {
    const existing = await tx.mcpCharacterEdit.findUnique({ where: { id } });
    if (existing && (existing.apiKeyHash !== owner || existing.characterId !== input.characterId)) return unavailable();
    const card = await visibleCard(tx, input.characterId, key);
    const inputHash = digest(input.operations);
    if (existing && existing.inputHash === inputHash && (!input.expectedRevision || existing.revision !== input.expectedRevision || existing.acceptedAt)) return summary(existing);
    if (existing && (existing.revision !== input.expectedRevision || existing.acceptedAt || existing.expiresAt <= new Date())) throw new CompendiumToolError(409, 'Review the current edit or start a new draft.');
    if (!existing && input.expectedRevision) return unavailable();
    const { differences } = await planOperations(tx, card, input.operations);
    const fields = { revision: digest([id, input.operations, differences]), inputHash, differences: jsonValue(differences), operations: jsonValue(input.operations) };
    const saved = existing ? await tx.mcpCharacterEdit.update({ where: { id }, data: fields })
      : await tx.mcpCharacterEdit.create({ data: { ...fields, id, apiKeyHash: owner, characterId: card.id,
        expiresAt: new Date(Date.now() + aiCharacterGenerationSettings.draftTtlHours * 3600000) } });
    return summary(saved);
  }, characterTransactionOptions);
}

export async function applyEdit(id: string, revision: string, key: string) {
  return prisma.$transaction(async tx => {
    const edit = await tx.mcpCharacterEdit.findFirst({ where: { id, apiKeyHash: hashApiKey(key) } });
    if (!edit) return unavailable();
    const card = await visibleCard(tx, edit.characterId, key);
    if (edit.revision !== revision) throw new CompendiumToolError(409, 'The reviewed revision changed.');
    if (edit.acceptedAt) return summary(edit);
    if (edit.expiresAt <= new Date()) throw new CompendiumToolError(409, 'Edit expired.');
    const operations = z.array(editOperation).parse(edit.operations);
    const { differences, update } = await planOperations(tx, card, operations);
    if (digest([id, operations, differences]) !== revision) throw new CompendiumToolError(409, 'The card or catalog entry changed. Refresh this preview with expectedRevision.');
    if (Object.keys(update).length) await tx.character.update({ where: { id: card.id }, data: update });
    for (const op of operations) {
      if (op.op === 'membership') await setMembershipInTransaction(tx, card.id, op.kind, op.entityId, op.present, key);
    }
    const saved = await tx.mcpCharacterEdit.update({ where: { id }, data: { acceptedAt: new Date() } });
    return summary(saved);
  }, characterTransactionOptions);
}
