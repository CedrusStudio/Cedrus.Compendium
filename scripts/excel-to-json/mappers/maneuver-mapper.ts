import { ulid } from 'ulid';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { parseCost } from '../parsers/cost-parser';
import { parseRequirements } from '../parsers/requirements-parser';
import { parseCooldown } from '../parsers/cooldown-parser';
import { parseNameAndGrade } from '../parsers/name-grade-parser';
import { parseTags } from '../parsers/tags-parser';
import { parseCastTimeFromDescription } from '../parsers/casttime-parser';

interface ManeuverExcelRow {
  Nazwa?: string;
  Nazwa_1?: string;
  Działanie?: string;
  Koszt?: string | number;
  Wymagania?: string;
  Częstotliwość?: string;
  War?: string | number;
  ST?: string | number;
  Typ?: string;
  Typ_1?: string;
}

export function mapManeuver(row: ManeuverExcelRow): Maneuver {
  // Użyj Nazwa_1 jeśli istnieje, w przeciwnym razie Nazwa
  const rawName = row.Nazwa_1 || row.Nazwa || '';
  const { name, grade } = parseNameAndGrade(rawName);

  // Parsuj koszt - priorytet dla War, potem Koszt
  const price = row.War 
    ? parseCost(row.War) 
    : parseCost(row.Koszt);

  // Parsuj description i castTime (wyciąga castTime z opisu i czyści opis)
  const rawDescription = row.Działanie || '';
  const { castTime, cleanDescription } = parseCastTimeFromDescription(rawDescription);

  // Parsuj requirements
  const requirements = parseRequirements(row.Wymagania);

  // Parsuj cooldown
  const cooldown = parseCooldown(row.Częstotliwość);

  // Parsuj tagi z Typ i Typ_1
  const tags = parseTags([row.Typ, row.Typ_1]);

  return {
    id: ulid(),
    name,
    grade,
    description: cleanDescription,
    castTime,
    cooldown,
    price,
    requirements,
    tags
  };
}

export function mapManeuvers(rows: ManeuverExcelRow[]): Maneuver[] {
  return rows
    .filter(row => {
      const rawName = row.Nazwa_1 || row.Nazwa || '';
      // Filtruj puste wiersze oraz wiersze z labelkami Excelowymi
      return rawName && rawName !== 'Nazwa' && rawName !== 'Nazwa_1';
    })
    .map(mapManeuver);
}
