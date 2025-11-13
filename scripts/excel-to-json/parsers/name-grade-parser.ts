/**
 * Parser dla nazwy i rangi (grade)
 * Wyciąga liczbę z końca nazwy jako grade
 * Przykład: "Finta1" => name: "Finta", grade: 1
 *          "Większy Fechtunek" => name: "Większy Fechtunek", grade: 1
 */

interface NameGradeResult {
  name: string;
  grade: number;
}

export function parseNameAndGrade(nameString: string | number | null | undefined): NameGradeResult {
  if (nameString === null || nameString === undefined || nameString === '') {
    return { name: '', grade: 1 };
  }

  const fullName = String(nameString).trim();

  // Szukaj liczby na końcu nazwy
  const match = fullName.match(/^(.+?)(\d+)$/);

  if (match && match[1] && match[2]) {
    const name = match[1].trim();
    const grade = parseInt(match[2], 10);
    return { name, grade };
  }

  // Brak liczby - zwróć całą nazwę z grade = 1
  return { name: fullName, grade: 1 };
}

/**
 * Przykłady:
 * parseNameAndGrade('Finta1') => { name: 'Finta', grade: 1 }
 * parseNameAndGrade('Większy Fechtunek5') => { name: 'Większy Fechtunek', grade: 5 }
 * parseNameAndGrade('Akrobatyka') => { name: 'Akrobatyka', grade: 1 }
 * parseNameAndGrade('CiosHarmonii2') => { name: 'CiosHarmonii', grade: 2 }
 */
