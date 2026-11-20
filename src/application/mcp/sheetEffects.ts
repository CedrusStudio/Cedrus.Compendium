import type { Character } from '@/domain/characters/Character';
import { applyActiveBuffProfile } from '@/domain/characters/buffs/applyBuffProfile';
import type { Delta } from './sheetItems';

function projection(c: Character) {
  const effective = applyActiveBuffProfile(c);
  const sets = (items: { id: string; name: string }[]) =>
    Object.fromEntries(items.map((item) => [item.id, item]));
  return {
    characteristics: effective.characteristics,
    attributes: effective.attributes,
    health: effective.health,
    offenses: sets(effective.offenses),
    defenses: sets(effective.defenses),
  };
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function effectiveDifferences(before: Character, after: Character) {
  const result: Delta[] = [];
  function visit(a: unknown, b: unknown, path: string) {
    if (a === b) return;
    if (object(a) && object(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
        visit(a[key], b[key], path ? path + '/' + key : key);
    } else if ((a ?? null) !== (b ?? null))
      result.push({ field: path, label: path, before: a ?? null, after: b ?? null });
  }
  visit(projection(before), projection(after), '');
  return result;
}
