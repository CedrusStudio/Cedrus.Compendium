import type { Prisma } from '@prisma/client';
import type { EditOperation } from '@/domain/mcp/writeContracts';
import { activeFields, gearGroups, profileGroups } from '@/domain/mcp/sheetContracts';
import { membershipKinds, membershipLimits } from '@/domain/characters/characterMembership';
import { headerSchema } from '@/persistence/schemas/characters/headerSchema';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import { formatRequirement } from '@/domain/requirements/formatRequirement';
import { checkRequirement, requirementEvidence } from '@/domain/requirements/checkRequirement';
import { healthSchema } from '@/persistence/schemas/characters/combat/healthSchema';
import { statisticSchema } from '@/persistence/schemas/characters/statistics/statisticSchema';
import { toCharacter, type CharacterWithRelations } from '@/persistence/mappings/characterMapping';
import { digest } from '@/persistence/mcp/changeIdentity';
import { inspectSheet } from './sheetAudit';
import { effectiveDifferences } from './sheetEffects';
import { editItem, checkItemLimits, invalid, type Delta } from './sheetItems';
import {
  relationGroups,
  remember,
  toggleRelation,
  relationUpdate,
  reconcilePowerReferences,
  type CatalogDependency,
} from './sheetRelations';

const editable = [
  'name',
  'shortName',
  'description',
  'tags',
  'health',
  'characteristics',
  'attributes',
  'talents',
  'offenses',
  'defenses',
  'defaultOffenseId',
  'defaultDefenseId',
  'powers',
  ...profileGroups,
  ...Object.values(activeFields),
] as const;
const limits = { ...membershipLimits, weapons: 10, armors: 10, shields: 10, mounts: 10, inventory: 100 };
const setField = (group: 'offenses' | 'defenses') =>
  group === 'offenses' ? 'defaultOffenseId' : 'defaultDefenseId';

export async function planSheetEdit(
  tx: Prisma.TransactionClient,
  original: CharacterWithRelations,
  operations: EditOperation[],
) {
  const row = structuredClone(original),
    differences: Delta[] = [];
  const dependencies = new Map<string, CatalogDependency>();
  let powersChanged = false;
  for (const op of operations) {
    switch (op.op) {
      case 'header': {
        const field = op.field;
        const value = headerSchema.shape[field].parse(op.value);
        if (field === 'raceId') {
          if (row.race) remember(dependencies, 'race', row.race);
          if (value === '') invalid('Supply a race ID or null.');
          const race = value ? await tx.race.findUnique({ where: { id: value } }) : null;
          if (value && !race) invalid('Race unavailable.');
          if (race) remember(dependencies, 'race', race);
          differences.push({
            field,
            label: 'Race',
            before: row.race && { id: row.race.id, name: row.race.name },
            after: race && { id: race.id, name: race.name },
          });
          row.race = race;
          row.raceId = race?.id ?? null;
        } else {
          if (typeof value !== 'string') invalid('Name is required.');
          if (
            value !== row[field] &&
            (await tx.character.findFirst({
              where: { [field]: value, id: { not: row.id } },
              select: { id: true },
            }))
          )
            invalid('Character name already in use: ' + field);
          differences.push({ field, label: field, before: row[field], after: value });
          row[field] = value;
        }
        break;
      }
      case 'description':
        differences.push({ field: op.op, label: op.op, before: row.description, after: op.value });
        row.description = headerSchema.shape.description.parse(op.value);
        break;
      case 'tags':
        differences.push({ field: op.op, label: op.op, before: row.tags, after: op.value });
        row.tags = headerSchema.shape.tags.parse(op.value);
        break;
      case 'statistic': {
        const stats: Record<string, typeof row.characteristics.strength> = Object.hasOwn(
          row.characteristics,
          op.statistic,
        )
          ? row.characteristics
          : row.attributes;
        if (!Object.hasOwn(stats, op.statistic)) invalid('Unknown statistic: ' + op.statistic);
        const cell = stats[op.statistic],
          field = op.statistic + '.' + op.component;
        differences.push({ field, label: field, before: cell[op.component], after: op.value });
        cell[op.component] = statisticSchema.shape[op.component].parse(op.value);
        break;
      }
      case 'health':
        differences.push({
          field: 'health/' + op.field,
          label: op.field,
          before: row.health[op.field],
          after: op.value,
        });
        row.health[op.field] = healthSchema.shape[op.field].parse(op.value);
        break;
      case 'replaceGear': {
        if (op.fromId === op.toId || !row[`${op.group}Ids`].includes(op.fromId))
          invalid('Select an equipped item and a different replacement.');
        differences.push(await toggleRelation(tx, row, op.group, op.fromId, false, dependencies));
        differences.push(await toggleRelation(tx, row, op.group, op.toId, true, dependencies));
        break;
      }
      case 'membership':
      case 'gear':
        differences.push(
          await toggleRelation(
            tx,
            row,
            op.op === 'gear' ? op.group : op.kind,
            op.entityId,
            op.present,
            dependencies,
          ),
        );
        break;
      case 'defaultSet': {
        const field = setField(op.group);
        differences.push({ field, label: field, before: row[field], after: op.id });
        row[field] = op.id;
        break;
      }
      case 'addItem':
      case 'patchItem':
      case 'removeItem':
        editItem(row, op, differences);
        if (op.group === 'powers') powersChanged = true;
        break;
      case 'activateProfile': {
        const field = activeFields[op.group],
          before = row[field].includes(op.id);
        differences.push({
          field: field + '/' + op.id,
          label: row[op.group].find((item) => item.id === op.id)?.name ?? op.id,
          before,
          after: op.active,
        });
        row[field] = op.active
          ? [...new Set([...row[field], op.id])]
          : row[field].filter((id) => id !== op.id);
        break;
      }
      case 'powerSpell': {
        const power = row.powers.find((item) => item.id === op.powerId);
        if (!power) invalid('Power unavailable: ' + op.powerId);
        const before = power.spellsIds.includes(op.spellId);
        const spell =
          row.spells.find((item) => item.id === op.spellId) ??
          (await tx.spell.findUnique({ where: { id: op.spellId } }));
        if (!spell && (op.present || !before)) invalid('Spell unavailable: ' + op.spellId);
        if (spell) remember(dependencies, 'spells', spell);
        differences.push({
          field: 'powers/' + power.id + '/spells/' + op.spellId,
          label: spell?.name ?? op.spellId,
          before,
          after: op.present,
        });
        power.spellsIds = op.present
          ? [...new Set([...power.spellsIds, op.spellId])]
          : power.spellsIds.filter((id) => id !== op.spellId);
        if (power.spellsIds.length > 100) invalid('Too many spells on a power.');
        powersChanged = true;
        break;
      }
    }
  }
  // Removing an active profile also removes that activation in the reviewed revision.
  for (const group of profileGroups) {
    const field = activeFields[group];
    for (const id of row[field]) {
      const removed = operations.some((op) => op.op === 'removeItem' && op.group === group && op.id === id);
      if (removed && !row[group].some((p) => p.id === id)) {
        differences.push({
          field: field + '/' + id,
          label: original[group].find((p) => p.id === id)?.name ?? id,
          before: true,
          after: false,
        });
        row[field] = row[field].filter((active) => active !== id);
      }
    }
  }
  if (powersChanged) await reconcilePowerReferences(tx, original, row, operations, dependencies, differences);
  for (const group of [...membershipKinds, ...gearGroups]) {
    if (row[`${group}Ids`].length > Math.max(original[`${group}Ids`].length, limits[group]))
      invalid('Limit exceeded: ' + group);
  }
  checkItemLimits(original, row);
  const previous = inspectSheet(original),
    findings = inspectSheet(row);
  const prior = new Set(previous.map(digest));
  const introduced = findings.filter((f) => !prior.has(digest(f)));
  const broken = introduced.find((f) => f.severity === 'integrity');
  if (broken) invalid('Invalid candidate: ' + broken.rule + ' at ' + broken.path);
  const changed = differences.filter((d) => digest([d.before]) !== digest([d.after]));
  if (new Set(differences.map((d) => d.field)).size !== differences.length)
    invalid('Change each field only once.');
  const update: Prisma.CharacterUpdateInput = {};
  for (const field of editable) {
    if (digest([original[field]]) !== digest([row[field]])) Object.assign(update, { [field]: row[field] });
  }
  if (row.raceId !== original.raceId)
    update.race = row.raceId ? { connect: { id: row.raceId } } : { disconnect: true };
  const orphanCleanup: Prisma.CharacterUncheckedUpdateInput = {};
  for (const group of relationGroups) {
    const field = `${group}Ids` as const;
    const removedOrphans = original[field].filter(
      (id) =>
        !row[field].includes(id) &&
        !original[group].some((entry) => entry.id === id) &&
        !dependencies.has(group + '/' + id),
    );
    // A dangling catalog ID has no reverse record. Remove its scalar link after the nested relation writes.
    const patch = relationUpdate(
      original[field].filter((id) => !removedOrphans.includes(id)),
      row[field],
    );
    if (patch) Object.assign(update, { [group]: patch });
    if (removedOrphans.length) Object.assign(orphanCleanup, { [field]: { set: row[field] } });
  }
  const current = new Set(findings.map(digest));
  const candidate = toCharacter(row);
  const catalog = [...dependencies.values()].sort((a, b) =>
    (a.group + '/' + a.id).localeCompare(b.group + '/' + b.id, 'en'),
  );
  const requirements = catalog.flatMap((entry) =>
    readStructuredRequirements(entry.parameters).map((requirement) => ({
      group: entry.group,
      id: entry.id,
      text: formatRequirement(requirement),
      met: checkRequirement(requirement, candidate),
      observed: requirementEvidence(requirement, candidate),
      basis: 'base',
    })),
  );
  const impact = {
    effective: effectiveDifferences(toCharacter(original), candidate),
    requirements,
    introduced,
    resolved: previous.filter((f) => !current.has(digest(f))),
  };
  return { differences: changed, update, orphanCleanup, impact, dependencies: catalog };
}
