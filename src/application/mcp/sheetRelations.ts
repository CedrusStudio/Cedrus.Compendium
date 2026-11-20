import type { Prisma } from '@prisma/client';
import type { EditOperation } from '@/domain/mcp/writeContracts';
import { invalid, type Delta } from './sheetItems';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import { formatRequirement } from '@/domain/requirements/formatRequirement';
import type { CharacterWithRelations } from '@/persistence/mappings/characterMapping';
import { gearGroups } from '@/domain/mcp/sheetContracts';
import { membershipKinds } from '@/domain/characters/characterMembership';
import { digest } from '@/persistence/mcp/changeIdentity';
import { unavailable } from './errors';

export const relationGroups = [...gearGroups, ...membershipKinds, 'spells', 'powerSpecifications'] as const;
export type Relation = (typeof relationGroups)[number];
type CatalogEntry = { id: string; name: string };
export type CatalogDependency = {
  group: string;
  id: string;
  name: string;
  fingerprint: string;
  parameters: Record<string, unknown>;
};
export function remember(deps: Map<string, CatalogDependency>, group: string, entry: CatalogEntry) {
  const values = Object.fromEntries(Object.entries(entry).filter(([field]) => field !== 'characterIds'));
  const parameters = Object.fromEntries(
    Object.entries(values).filter(
      ([field]) =>
        !['id', 'name', 'description', 'effects', 'unsupportedReason', 'simulatable'].includes(field),
    ),
  );
  deps.set(group + '/' + entry.id, {
    group,
    id: entry.id,
    name: entry.name,
    fingerprint: digest(values),
    parameters,
  });
}

function lookup(tx: Prisma.TransactionClient, group: Relation, id: string) {
  const args = { where: { id } };
  switch (group) {
    case 'weapons':
      return tx.weapon.findUnique(args);
    case 'armors':
      return tx.armor.findUnique(args);
    case 'shields':
      return tx.shield.findUnique(args);
    case 'inventory':
      return tx.inventoryItem.findUnique(args);
    case 'mounts':
      return tx.mount.findUnique(args);
    case 'maneuvers':
      return tx.maneuver.findUnique(args);
    case 'perks':
      return tx.perk.findUnique(args);
    case 'stances':
      return tx.stance.findUnique(args);
    case 'states':
      return tx.state.findUnique(args);
    case 'spells':
      return tx.spell.findUnique(args);
    case 'powerSpecifications':
      return tx.powerSpecification.findUnique(args);
  }
}

export async function toggleRelation(
  tx: Prisma.TransactionClient,
  row: CharacterWithRelations,
  group: Relation,
  id: string,
  present: boolean,
  deps: Map<string, CatalogDependency>,
) {
  const ids = row[`${group}Ids`],
    entries: CatalogEntry[] = row[group];
  const before = ids.includes(id);
  const entry = entries.find((item) => item.id === id) ?? (await lookup(tx, group, id));
  if (!entry) {
    if (present || !before) return unavailable();
    row[`${group}Ids`] = ids.filter((item) => item !== id);
    return { field: group + '/' + id, label: id, before: true, after: false };
  }
  remember(deps, group, entry);
  if (before !== present) {
    if (present) {
      ids.push(id);
      entries.push(entry);
    } else {
      row[`${group}Ids`] = ids.filter((item) => item !== id);
      const index = entries.findIndex((item) => item.id === id);
      if (index >= 0) entries.splice(index, 1);
    }
  }
  const repertoire =
    'grade' in entry
      ? {
          grade: entry.grade,
          requirements: readStructuredRequirements(entry as { structuredRequirements?: unknown }).map(
            formatRequirement,
          ),
        }
      : {};
  return { field: group + '/' + id, label: entry.name, ...repertoire, before, after: present };
}

export async function reconcilePowerReferences(
  tx: Prisma.TransactionClient,
  original: CharacterWithRelations,
  row: CharacterWithRelations,
  operations: EditOperation[],
  dependencies: Map<string, CatalogDependency>,
  differences: Delta[],
) {
  const refs = (powers: typeof row.powers) => ({
    spells: new Set(powers.flatMap((p) => p.spellsIds)),
    powerSpecifications: new Set(powers.map((p) => p.powerSpecificationId)),
  });
  const before = refs(original.powers),
    after = refs(row.powers);
  for (const group of ['spells', 'powerSpecifications'] as const) {
    const changedIds = new Set(
      [...before[group], ...after[group]].filter((id) => before[group].has(id) !== after[group].has(id)),
    );
    for (const op of operations) {
      if (op.op === 'powerSpell' && group === 'spells') changedIds.add(op.spellId);
      if (
        (op.op === 'addItem' || op.op === 'patchItem') &&
        op.group === 'powers' &&
        group === 'powerSpecifications' &&
        typeof op.fields.powerSpecificationId === 'string'
      )
        changedIds.add(op.fields.powerSpecificationId);
    }
    for (const id of changedIds) {
      if (row[`${group}Ids`].includes(id) !== after[group].has(id))
        differences.push(await toggleRelation(tx, row, group, id, after[group].has(id), dependencies));
    }
  }
  for (const op of operations) {
    if (
      (op.op === 'addItem' || op.op === 'patchItem') &&
      op.group === 'powers' &&
      typeof op.fields.powerSpecificationId === 'string'
    ) {
      const spec = row.powerSpecifications.find((s) => s.id === op.fields.powerSpecificationId);
      if (!spec) invalid('Power specification unavailable.');
      remember(dependencies, 'powerSpecifications', spec);
    }
  }
}

export function relationUpdate(before: string[], after: string[]) {
  const connect = after.filter((id) => !before.includes(id)).map((id) => ({ id }));
  const disconnect = before.filter((id) => !after.includes(id)).map((id) => ({ id }));
  return connect.length || disconnect.length ? { connect, disconnect } : undefined;
}
