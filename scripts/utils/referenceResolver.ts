/**
 * Utility for resolving references (name, grade) to IDs
 */

export type Reference = {
  name: string;
  grade: number;
};

export type ItemWithId = {
  id: string;
  name: string;
  grade: number;
};

export type ResolveResult = {
  ids: string[];
  missing: Reference[];
};

/**
 * Normalizes a name for comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Replaces multiple spaces with single space
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Creates a lookup key from name and grade
 */
function createKey(name: string, grade: number): string {
  return `${normalizeName(name)}|${grade}`;
}

/**
 * Creates a Map for fast ID lookups by (name, grade) pair
 */
export function createLookupMap(items: ItemWithId[]): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const item of items) {
    const key = createKey(item.name, item.grade);
    if (map.has(key)) {
      console.warn(`⚠️  Duplicate key detected: ${key} (ID: ${item.id})`);
    }
    map.set(key, item.id);
  }
  
  return map;
}

/**
 * Resolves an array of references to their IDs using a lookup map
 * Returns both found IDs and missing references
 */
export function resolveReferences(
  references: Reference[],
  lookupMap: Map<string, string>
): ResolveResult {
  const ids: string[] = [];
  const missing: Reference[] = [];
  
  for (const ref of references) {
    const key = createKey(ref.name, ref.grade);
    const id = lookupMap.get(key);
    
    if (id) {
      ids.push(id);
    } else {
      missing.push(ref);
    }
  }
  
  return { ids, missing };
}

/**
 * Creates a report of missing references
 */
export function createMissingReport(
  characterName: string,
  type: string,
  missing: Reference[]
): string {
  if (missing.length === 0) return '';
  
  const items = missing
    .map(ref => `  - "${ref.name}" (grade: ${ref.grade})`)
    .join('\n');
  
  return `⚠️  ${characterName} - ${type}: ${missing.length} not found:\n${items}`;
}
