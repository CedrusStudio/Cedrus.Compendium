import { z } from 'zod';
import type { EditOperation } from '@/domain/mcp/writeContracts';
import type { CharacterWithRelations } from '@/persistence/mappings/characterMapping';
import { buffProfileSchema } from '@/persistence/schemas/characters/buffs/buffProfileSchema';
import { defenseSchema } from '@/persistence/schemas/characters/combat/defenseSchema';
import { offenseSchema } from '@/persistence/schemas/characters/combat/offenseSchema';
import { powerSchema } from '@/persistence/schemas/characters/combat/powerSchema';
import { talentSchema } from '@/persistence/schemas/characters/talentSchema';
import { createDefaultModifierProfile } from '@/domain/characters/buffs/BuffProfile';
import { CreateDefaultDefense } from '@/domain/characters/combat/Defense';
import {
  CreateDefaultOffense,
  CreateDamageOffense,
  CreateWeaponOffense,
} from '@/domain/characters/combat/Offense';
import { defaultPower } from '@/domain/characters/combat/Power';
import { CreateDefaultTalent } from '@/domain/characters/Talent';
import { digest } from '@/persistence/mcp/changeIdentity';
import { CompendiumToolError } from './errors';

export function invalid(message: string): never {
  throw new CompendiumToolError(422, message);
}
export type Delta = { field: string; label: string; before: unknown; after: unknown };
type ItemOp = Extract<EditOperation, { op: 'addItem' | 'patchItem' | 'removeItem' }>;
const storedPower = powerSchema.omit({ spells: true }).extend({ spellsIds: z.array(z.string()).max(100) });
const profiles = { schema: buffProfileSchema, seed: createDefaultModifierProfile, limit: 20 };
const definitions = {
  offenses: { schema: offenseSchema, seed: CreateDefaultOffense, limit: 10 },
  defenses: { schema: defenseSchema, seed: CreateDefaultDefense, limit: 10 },
  talents: { schema: talentSchema, seed: CreateDefaultTalent, limit: Infinity },
  powers: { schema: storedPower, seed: () => ({ ...defaultPower, spellsIds: [] }), limit: 100 },
  buffProfiles: profiles,
  stanceModifierProfiles: profiles,
  stateModifierProfiles: profiles,
  otherModifierProfiles: profiles,
};

export function checkItemLimits(before: CharacterWithRelations, after: CharacterWithRelations) {
  for (const group of Object.keys(definitions) as ItemOp['group'][]) {
    if (after[group].length > Math.max(before[group].length, definitions[group].limit))
      invalid('Limit exceeded: ' + group);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assignField(item: Record<string, unknown>, schema: z.ZodType, path: string, value: unknown) {
  const parts = path.split('.');
  let target = item;
  for (const [index, part] of parts.entries()) {
    while (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable)
      schema = schema.unwrap() as z.ZodType;
    if (
      !(schema instanceof z.ZodObject) ||
      !Object.hasOwn(schema.shape, part) ||
      ['id', 'spellsIds'].includes(part)
    )
      invalid('Unknown or protected sheet field: ' + path);
    schema = schema.shape[part];
    if (index === parts.length - 1) {
      const cleared = value === null && schema.safeParse(undefined).success;
      const after = cleared ? null : schema.parse(value);
      if (!cleared && typeof after !== typeof value && !(value === null && after === null))
        invalid('Incorrect field type: ' + path);
      const before = target[part] ?? null;
      target[part] = after;
      return { before, after };
    }
    if (target[part] == null) {
      if (part === 'secondaryWeapon') target[part] = CreateWeaponOffense();
      else if (part === 'additionalDamageBonus') target[part] = CreateDamageOffense();
    }
    const nested = target[part];
    if (!isRecord(nested)) invalid('Invalid nested field: ' + path);
    target = nested;
  }
  return invalid('Empty field name.');
}

export function editItem(row: CharacterWithRelations, op: ItemOp, deltas: Delta[]) {
  const definition = definitions[op.group];
  const items: { id: string; name: string }[] = row[op.group];
  const matches = items.filter((e) => e.id === op.id);
  const existing = matches[0],
    path = op.group + '/' + op.id;
  if (matches.length > 1) invalid('Ambiguous item ID: ' + path);
  if (op.op === 'addItem' ? existing : !existing) invalid('Unexpected item membership: ' + path);
  if (op.op === 'removeItem') {
    deltas.push({ field: path, label: existing.name, before: existing, after: null });
    items.splice(items.indexOf(existing), 1);
    return;
  }
  if (!Object.keys(op.fields).length) invalid('Supply at least one editable field.');
  if (op.op === 'addItem' && !op.fields.name) invalid('A new item needs a name: ' + op.group);
  const item = structuredClone(existing ?? { ...definition.seed(), id: op.id });
  const initialized = new Set<string>();
  for (const [field, value] of Object.entries(op.fields)) {
    const top = field.split('.')[0];
    if (top !== field && Object.hasOwn(op.fields, top)) invalid('Overlapping fields: ' + field);
    if (top !== field && (item as Record<string, unknown>)[top] == null) initialized.add(top);
    const change = assignField(item as Record<string, unknown>, definition.schema, field, value);
    if (op.op === 'patchItem' && !initialized.has(top) && digest([change.before]) !== digest([change.after]))
      deltas.push({ field: path + '/' + field, label: existing.name, ...change });
  }
  if (op.op === 'patchItem')
    for (const field of initialized) {
      deltas.push({
        field: path + '/' + field,
        label: existing.name,
        before: null,
        after: (item as Record<string, unknown>)[field],
      });
    }
  if (op.op === 'addItem') {
    const saved = definition.schema.parse(item);
    items.push(saved);
    deltas.push({ field: path, label: saved.name, before: null, after: structuredClone(saved) });
  } else items[items.indexOf(existing)] = item;
}
