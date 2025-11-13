import { ulid } from 'ulid';
import { Perk } from '@/domain/characters/Perk';
import { parseCostWithMultiplier } from '../parsers/cost-parser';
import { parseRequirements } from '../parsers/requirements-parser';
import { parseNameAndGrade } from '../parsers/name-grade-parser';
import { parseTags } from '../parsers/tags-parser';

interface PerkExcelRow {
  Nazwa?: string;
  Działanie?: string;
  Koszt?: string | number;
  Wymagania?: string;
  Wymogi?: string; // Alternatywna nazwa kolumny
  War?: string | number;
  Typ?: string;
}

export function mapPerk(row: PerkExcelRow): Perk {
  // Parsuj nazwę i grade
  const rawName = row.Nazwa || '';
  const { name, grade } = parseNameAndGrade(rawName);

  // Parsuj koszt - priorytet dla War, potem Koszt (z obsługą mnożenia)
  const costValue = row.War || row.Koszt;
  const { price, additionalCost } = parseCostWithMultiplier(costValue);

  // Parsuj description
  let description = row.Działanie || 'Brak opisu';
  
  // Jeśli jest dodatkowy koszt, dodaj do opisu
  if (additionalCost) {
    description = `${description}. Dodatkowy koszt ${additionalCost}`;
  }

  // Parsuj requirements - obsłuż obie nazwy kolumn
  const requirementsString = row.Wymagania || row.Wymogi;
  const requirements = parseRequirements(requirementsString);

  // Parsuj tagi
  const tags = parseTags([row.Typ]);

  return {
    id: ulid(),
    name,
    grade,
    description,
    requirements,
    price,
    tags
  };
}

export function mapPerks(rows: PerkExcelRow[]): Perk[] {
  return rows
    .filter(row => {
      const rawName = row.Nazwa || '';
      const rawDescription = row.Działanie || '';
      const costValue = row.War || row.Koszt;
      const { price } = parseCostWithMultiplier(costValue);
      
      // Filtruj:
      // 1. Puste wiersze
      // 2. Labelki Excelowe (Nazwa="Nazwa")
      // 3. Labelki bez opisu i bez kosztu (price=0 i description="Brak opisu")
      //    ALE zachowaj perki które mają sensowny opis mimo price=0
      
      if (!rawName || rawName === 'Nazwa') {
        return false;
      }
      
      // Jeśli ma opis, zachowaj niezależnie od ceny
      if (rawDescription && rawDescription.trim() !== '' && rawDescription !== 'Brak opisu') {
        return true;
      }
      
      // Jeśli nie ma opisu i cena=0, to labelka
      if ((!rawDescription || rawDescription.trim() === '') && price === 0) {
        return false;
      }
      
      return true;
    })
    .map(mapPerk);
}
