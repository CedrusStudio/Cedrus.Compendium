import { isDeepStrictEqual } from 'node:util';
import type { RelationPayload } from '@/persistence/mappings/createUpsertPayload';
import { CharacterValidationError } from './characterErrors';

export type RelationOperationCounts = { create: number; update: number; connect: number; disconnect: number };

function hasChanges(incoming: object, stored: object): boolean {
  const current = stored as Record<string, unknown>;
  return Object.entries(incoming).some(([key, value]) => {
    if (key === 'id' || value === undefined) return false;
    let previous = current[key];
    if (['structuredRequirements', 'replaces', 'effects', 'tags'].includes(key)) previous ??= [];
    if (key === 'cooldown') previous ??= 0;
    return !isDeepStrictEqual(value, previous);
  });
}

/** One relation per ID even when a spell belongs to several powers. */
export function changedRelations<T extends { id: string }>(existingIds: string[], incoming: T[], stored: { id: string }[]) {
  const existing = new Set(existingIds);
  const storedById = new Map(stored.map(item => [item.id, item]));
  const uniqueById = new Map<string, T>();
  for (const item of incoming) {
    const previous = uniqueById.get(item.id);
    const current = storedById.get(item.id);
    if (previous && (!current || existing.has(item.id))) {
      const changes = (value: T) => Object.fromEntries(Object.entries(value)
        .filter(([key, field]) => hasChanges({ [key]: field }, current ?? {})));
      const previousChanges = changes(previous), nextChanges = changes(item);
      const hadChanges = Object.keys(previousChanges).length > 0;
      const hasNextChanges = Object.keys(nextChanges).length > 0;
      if (hadChanges && hasNextChanges && !isDeepStrictEqual(previousChanges, nextChanges)) {
        throw new CharacterValidationError('Ten sam element ma różne zmiany w kilku miejscach formularza. Ustaw jednakowe wartości przed zapisem.');
      }
      // A later unchanged copy must not undo an edit in an earlier power.
      if (hadChanges && !hasNextChanges) continue;
    }
    uniqueById.set(item.id, item);
  }
  const unique = [...uniqueById.values()];
  const payload: RelationPayload<T> = {
    create: unique.filter(item => !existing.has(item.id) && !storedById.has(item.id)),
    update: unique.filter(item => existing.has(item.id))
      // Preserve the existing missing-record conflict rather than silently dropping a write.
      .filter(item => !storedById.has(item.id) || hasChanges(item, storedById.get(item.id)!))
      .map(item => ({ where: { id: item.id }, data: { ...item, id: undefined } })),
    disconnect: [...existing].filter(id => !uniqueById.has(id)).map(id => ({ id })),
    connect: unique.filter(item => !existing.has(item.id) && storedById.has(item.id)).map(item => ({ id: item.id })),
  };
  const counts: RelationOperationCounts = {
    create: payload.create.length, update: payload.update.length,
    connect: payload.connect.length, disconnect: payload.disconnect.length,
  };
  return { payload: Object.values(counts).some(count => count > 0) ? payload : undefined, counts };
}
