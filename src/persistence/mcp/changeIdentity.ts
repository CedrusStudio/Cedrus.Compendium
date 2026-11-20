import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return '{' + Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v)).join(',') + '}';
  }
  return JSON.stringify(value);
}
export function digest(value: unknown) { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function changeId(kind: 'create' | 'edit', owner: string, requestId: string) {
  return kind + '-' + digest([owner, requestId]);
}
export function creationRevision(draft: { request: unknown; proposal: unknown; mcpVisibility?: string | null }) {
  return digest([draft.request, draft.proposal, draft.mcpVisibility ?? 'mine']);
}
export const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
