/**
 * Groups items by their name property and sorts by grade within each group.
 * Returns an array of groups, each containing the name and sorted items.
 */
export interface GroupedItem<T extends { name: string; grade: number }> {
  name: string;
  items: T[];
}

export function groupByName<T extends { name: string; grade: number }>(
  items: T[]
): GroupedItem<T>[] {
  // Group items by name using Map
  const groupsMap = new Map<string, T[]>();
  
  for (const item of items) {
    const existing = groupsMap.get(item.name);
    if (existing) {
      existing.push(item);
    } else {
      groupsMap.set(item.name, [item]);
    }
  }
  
  // Convert to array and sort items within each group by grade
  const groups: GroupedItem<T>[] = [];
  
  for (const [name, groupItems] of groupsMap.entries()) {
    // Sort items by grade ascending
    groupItems.sort((a, b) => a.grade - b.grade);
    groups.push({ name, items: groupItems });
  }
  
  // Sort groups by name alphabetically
  groups.sort((a, b) => a.name.localeCompare(b.name));
  
  return groups;
}

/**
 * Flattens grouped items back into a single array.
 * Useful for converting grouped view back to flat list.
 */
export function flattenGroups<T extends { name: string; grade: number }>(
  groups: GroupedItem<T>[]
): T[] {
  return groups.flatMap(group => group.items);
}
