/**
 * Parsuje string z Excel na nazwę i rangę.
 * 
 * Przykłady:
 * - "GardaPiesciarza1" → { name: "Garda Pięściarza", grade: 1 }
 * - "CiosZawodowca2" → { name: "Cios Zawodowca", grade: 2 }
 * - "Defensywna walka wręcz" → { name: "Defensywna walka wręcz", grade: 1 }
 */
export function parseNameAndGrade(rawName: string): { name: string; grade: number } {
  if (!rawName || rawName.trim().length === 0) {
    return { name: '', grade: 1 };
  }

  const trimmed = rawName.trim();

  // Pattern: nazwa zakończona cyfrą (np. "GardaPiesciarza1")
  const match = trimmed.match(/^(.+?)(\d+)$/);

  if (match) {
    const namepart = match[1];
    const grade = parseInt(match[2], 10);

    // Dodaj spacje przed wielkimi literami (CamelCase → Camel Case)
    const spacedName = namepart.replace(/([A-Z])/g, ' $1').trim();

    return { name: spacedName, grade };
  }

  // Brak cyfry na końcu - domyślnie grade = 1
  return { name: trimmed, grade: 1 };
}

/**
 * Parsuje listę nazw z Excel (rozdzielone przecinkami lub średnikami)
 * 
 * Przykład:
 * - "GardaPiesciarza1, CiosZawodowca2" → [{ name: "Garda Pięściarza", grade: 1 }, ...]
 */
export function parseNameAndGradeList(raw: string): Array<{ name: string; grade: number }> {
  if (!raw || raw.trim().length === 0 || raw.toLowerCase() === "brak" || raw.toLowerCase().includes("brak manewrów")) {
    return [];
  }

  const items = raw.split(/[,;]/).map(item => item.trim()).filter(item => item.length > 0);
  return items.map(item => parseNameAndGrade(item));
}

/**
 * Znajduje obiekt w tablicy zasobów po nazwie i randze.
 * Używa case-insensitive matching.
 */
export function findByNameAndGrade<T extends { name: string; grade: number }>(
  resources: T[],
  name: string,
  grade: number
): T | undefined {
  const normalizedName = name.toLowerCase().trim();
  return resources.find(
    resource => resource.name.toLowerCase().trim() === normalizedName && resource.grade === grade
  );
}

/**
 * Normalizuje nazwę dla case-insensitive matching
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalizuj wielokrotne spacje
    .normalize('NFD')     // Normalizuj znaki Unicode
    .replace(/[\u0300-\u036f]/g, ''); // Usuń znaki diakrytyczne
}
