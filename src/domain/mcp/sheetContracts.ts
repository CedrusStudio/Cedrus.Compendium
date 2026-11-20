import { z } from 'zod';

export const profileGroups = [
  'buffProfiles',
  'stanceModifierProfiles',
  'stateModifierProfiles',
  'otherModifierProfiles',
] as const;
export const activeFields = {
  buffProfiles: 'activeBuffProfileIds',
  stanceModifierProfiles: 'activeStanceModifierProfileIds',
  stateModifierProfiles: 'activeStateModifierProfileIds',
  otherModifierProfiles: 'activeOtherModifierProfileIds',
} as const;
export const gearGroups = ['weapons', 'armors', 'shields', 'inventory', 'mounts'] as const;
const collections = ['offenses', 'defenses', 'talents', 'powers', ...profileGroups] as const;
const id = z.string().min(1).max(100);
const fields = z
  .record(
    z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*){0,3}$/),
    z.union([z.string().max(10000), z.number().finite(), z.boolean(), z.null()]),
  )
  .describe(
    'Individual editable sheet fields, e.g. {"name":"Guard","defense.block":1}. Nested paths use dots. Only supplied fields change. Use null to clear an optional field.',
  );

export const sheetOperations = [
  z.strictObject({
    op: z.literal('header'),
    field: z.enum(['name', 'shortName', 'raceId']),
    value: z.string().max(200).nullable(),
  }),
  z.strictObject({ op: z.literal('gear'), group: z.enum(gearGroups), entityId: id, present: z.boolean() }),
  z.strictObject({ op: z.literal('replaceGear'), group: z.enum(gearGroups), fromId: id, toId: id }),
  z.strictObject({
    op: z.literal('health'),
    field: z.enum([
      'barrier',
      'vitality',
      'toughness',
      'recoveryLevel',
      'lethalHealth',
      'lethalRounds',
      'bonus',
    ]),
    value: z.number().int(),
  }),
  z.strictObject({ op: z.literal('defaultSet'), group: z.enum(['offenses', 'defenses']), id: id.nullable() }),
  z.strictObject({
    op: z.literal('addItem'),
    group: z.enum(collections),
    id: z.ulid().describe('New stable ULID. Reuse it on retry or in subsequent operations.'),
    fields,
  }),
  z.strictObject({ op: z.literal('patchItem'), group: z.enum(collections), id, fields }),
  z.strictObject({ op: z.literal('removeItem'), group: z.enum(collections), id }),
  z.strictObject({ op: z.literal('activateProfile'), group: z.enum(profileGroups), id, active: z.boolean() }),
  z.strictObject({ op: z.literal('powerSpell'), powerId: id, spellId: id, present: z.boolean() }),
] as const;
export const auditSections = [
  'combat',
  'equipment',
  'requirements',
  'buffs',
  'powers',
  'talents',
  'statistics',
] as const;
export const auditInput = z.strictObject({
  characterId: id,
  sections: z.array(z.enum(auditSections)).min(1).max(auditSections.length).optional(),
});
