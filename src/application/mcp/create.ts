import 'server-only';
import { z } from 'zod';
import { hashApiKey } from '@/lib/apiKeyHash';
import { readCreation } from './readCreation';
import prisma from '@/lib/prisma';
import { aiCharacterGenerationSettings } from '@/lib/env';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { validateAiCharacterGenerationInputLimits } from '@/domain/ai-character-generation/aiCharacterGenerationInputLimits';
import { characterGenerationInstructions } from '@/domain/ai-character-generation/characterGenerationInstructions';
import { buildCharacterGenerationContext } from '@/domain/ai-character-generation/buildCharacterGenerationContext';
import { normalizeAiProposalIdentifiers, buildCatalogIdentityIndex } from '@/domain/ai-character-generation/normalizeAiProposalIdentifiers';
import { validateAiCharacterProposalRequirements } from '@/domain/ai-character-generation/validateAiCharacterProposalRequirements';
import { reviewAiCharacterProposalCombat } from '@/domain/ai-character-generation/reviewAiCharacterProposalCombat';
import { getAiCharacterGenerationAllowedReferences, validateAiCharacterProposalForAcceptance } from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import { loadAiCharacterRulebookFragments } from '@/persistence/ai-character-generation/aiCharacterRulebookContext';
import { loadAiCharacterBalanceProfiles } from '@/persistence/ai-character-generation/aiCharacterBalanceRepository';
import { MongoCharacterGenerationContextSource } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { aiCharacterProposalStrictJsonSchema, stripWireNulls } from '@/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat';
import { contextInput, createInput } from '@/domain/mcp/writeContracts';
import { changeId, creationRevision, digest, jsonValue } from '@/persistence/mcp/changeIdentity';
import { selectBalanceProfiles } from '@/domain/ai-character-generation/buildBalanceProfiles';
import { compareToBalanceProfile } from '@/domain/ai-character-generation/compareToBalanceProfile';
import { CompendiumToolError, unavailable } from './errors';

async function creationData(brief: z.infer<typeof contextInput>['brief'], apiKey: string) {
  if (brief.constraints.allowCustomAbilities || brief.constraints.allowCustomEquipment) throw new CompendiumToolError(400, 'Select existing catalog entries for MCP drafts.');
  const limits = validateAiCharacterGenerationInputLimits(brief, aiCharacterGenerationSettings);
  if (limits.length) throw new CompendiumToolError(400, 'Brief exceeds the configured generation limits.');
  const source = new MongoCharacterGenerationContextSource();
  const [references, catalogEntries, catalogRequirements, balanceProfiles] = await Promise.all([
    source.loadReferences({ apiKey, referenceCharacterIds: brief.referenceCharacterIds }),
    source.loadCatalog(), source.loadCatalogRequirements(), loadAiCharacterBalanceProfiles(apiKey),
  ]);
  return { references, catalogEntries, catalogRequirements, balanceProfiles };
}

export async function creationContext(input: z.infer<typeof contextInput>, key: string) {
  if (input.part === 'instructions') return { instructions: characterGenerationInstructions };
  if (input.part === 'schema') {
    if (!input.section) return { proposalSchema: aiCharacterProposalStrictJsonSchema };
    const fields = aiCharacterProposalStrictJsonSchema.properties as Record<string, unknown>;
    if (!Object.hasOwn(fields, input.section)) return unavailable();
    return { section: input.section, schema: fields[input.section] };
  }
  const data = await creationData(input.brief, key);
  const context = buildCharacterGenerationContext(input.brief, data.references, {
    ...data, rulebookFragments: loadAiCharacterRulebookFragments(input.brief.description),
  });
  switch (input.part) {
    case 'references': return context.references.slice(input.offset, input.offset + input.limit);
    case 'rulebook': return context.rulebookContext;
    case 'balance': return context.balanceProfiles;
    case 'catalog': return { total: context.allowedCatalog.entries.length,
      entries: context.allowedCatalog.entries.slice(input.offset, input.offset + input.limit) };
    case 'overview': return { request: context.request, powerTier: context.powerTier, powerScale: context.powerScale,
      references: context.references.map(({ id, name }) => ({ id, name })), catalogCount: context.allowedCatalog.entries.length,
      parts: ['instructions', 'schema', 'references', 'catalog', 'rulebook', 'balance'],
      usage: 'Read instructions and proposal schema before authoring. Request catalog pages or search for additional entries.' };
  }
}

export async function previewCreation(input: z.infer<typeof createInput>, key: string) {
  const owner = hashApiKey(key);
  const id = changeId('create', owner, input.requestId);
  const inputHash = digest([input.brief, input.proposal, input.visibility]);
  const existing = await prisma.aiCharacterDraft.findUnique({ where: { id } });
  if (existing && existing.apiKeyHash !== owner) return unavailable();
  if (existing?.mcpInputHash === inputHash) return readCreation(id, key);
  if (existing && (existing.status !== 'pending' || existing.expiresAt <= new Date() || creationRevision(existing) !== input.expectedRevision))
    throw new CompendiumToolError(409, 'Draft changed or expired. Read the current preview.');
  if (!existing && input.expectedRevision) return unavailable();
  const data = await creationData(input.brief, key);
  const normalized = normalizeAiProposalIdentifiers(stripWireNulls(structuredClone(input.proposal)), { catalog: buildCatalogIdentityIndex(data.catalogEntries) });
  const proposal = aiCharacterProposalSchema.parse(normalized);
  const blockers = validateAiCharacterProposalForAcceptance(proposal, getAiCharacterGenerationAllowedReferences(data.references, data.catalogEntries));
  const equipment = proposal.equipment;
  const extraReferences = { weapon: equipment.weapons, armor: equipment.armors, shield: equipment.shields,
    inventoryItem: equipment.inventory, mount: equipment.mounts, perk: proposal.perks };
  for (const [kind, entries] of Object.entries(extraReferences)) {
    const ids = new Set(data.catalogEntries.filter(entry => entry.kind === kind).map(entry => entry.id));
    if (entries.some(entry => !ids.has(entry.id)) || new Set(entries.map(entry => entry.id)).size !== entries.length)
      blockers.push('Invalid or duplicate catalog reference: ' + kind);
  }
  if (blockers.length) throw new CompendiumToolError(422, blockers.join('\n'));
  const nameTaken = await prisma.character.findFirst({ where: { OR: [{ name: proposal.header.name }, { shortName: proposal.header.shortName }] }, select: { id: true } });
  if (nameTaken) throw new CompendiumToolError(409, 'Character name or short name is already taken.');
  const warnings = [...validateAiCharacterProposalRequirements(proposal, data.catalogRequirements), ...reviewAiCharacterProposalCombat(proposal)];
  const balance = selectBalanceProfiles(data.balanceProfiles, proposal.header.tags.join(' ')).map(profile => compareToBalanceProfile({
    attributes: proposal.statistics.attributes, maneuverCount: proposal.combat.maneuvers.length, perkCount: proposal.perks.length,
  }, profile));
  const fields = { request: jsonValue(input.brief), proposal: jsonValue(proposal), referenceCharacterIds: input.brief.referenceCharacterIds,
    validationIssues: jsonValue(warnings.slice(0, 50)), mcpVisibility: input.visibility, mcpInputHash: inputHash };
  if (existing) {
    const saved = await prisma.aiCharacterDraft.updateMany({ where: { id, apiKeyHash: owner, updatedAt: existing.updatedAt, status: 'pending', expiresAt: { gt: new Date() } }, data: fields });
    if (!saved.count) throw new CompendiumToolError(409, 'Draft changed. Read the current preview.');
  } else {
    await prisma.aiCharacterDraft.create({ data: { ...fields, id, apiKeyHash: owner, provider: 'mcp', model: 'chat',
      promptVersion: 'character-draft-v1', costMicroUsd: 0, expiresAt: new Date(Date.now() + aiCharacterGenerationSettings.draftTtlHours * 3600000) } });
  }
  return { ...await readCreation(id, key), balance };
}
