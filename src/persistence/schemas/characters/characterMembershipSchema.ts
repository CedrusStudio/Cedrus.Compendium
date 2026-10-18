import { z } from 'zod';
import { membershipKinds } from '@/domain/characters/characterMembership';

export const membershipKindSchema = z.enum(membershipKinds);
export const membershipParamsSchema = z.object({
  id: z.string().trim().min(1).max(200),
  kind: membershipKindSchema,
  entityId: z.string().trim().min(1).max(200),
}).strict();
export const characterMembershipSchema = z.object({ present: z.boolean() }).strict();

const ids = z.array(z.string().min(1)).max(10_000);
export const detailsMembershipSchema = z.object({ perksIds: ids }).strict();
export const combatMembershipSchema = z.object({
  maneuversIds: ids, stancesIds: ids, statesIds: ids,
  spellsIds: ids, powerSpecificationsIds: ids,
}).strict();
export type DetailsMembership = z.infer<typeof detailsMembershipSchema>;
export type CombatMembership = z.infer<typeof combatMembershipSchema>;
