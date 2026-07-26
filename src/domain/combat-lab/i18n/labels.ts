/**
 * Polish display labels for Combat Lab domain vocabulary. Code identifiers stay
 * English (repo convention — see `@/common/translations`), but every
 * user-facing string routes through these maps. Centralized so `describeManeuver`
 * (maneuver text) and `describeEvent` (replay) share one PL vocabulary.
 *
 * Longer term these can be folded into `displayedText` / `translations.pl-PL.ts`
 * for multi-locale support (see plan, "Terminologia i tłumaczenia").
 */

import type { DamageType, StatusId, ControlKind, ResourceKind } from "@/domain/combat-lab/effects/Effect";
import type { DeathCause } from "@/domain/combat-lab/simulation/RawResult";

/** Genitive form for "obrażeń <X>" (e.g. "obrażeń zwyczajnych"). */
export const damageTypeLabelsPl: Record<DamageType, string> = {
  zwyczajne: "zwyczajnych",
  blokowane: "blokowanych",
  bezpośrednie: "bezpośrednich",
  śmiertelne: "śmiertelnych",
  nieuchronne: "nieuchronnych",
};

export const statusLabelsPl: Record<StatusId, string> = {
  bleeding: "Krwawienie",
  poisoned: "Zatrucie",
  burning: "Podpalenie",
  stagger: "Oszołomienie",
  stun: "Ogłuszenie",
  root: "Unieruchomienie",
  disarm: "Rozbrojenie",
  slow: "Spowolnienie",
  marked: "Naznaczenie",
};

export const controlVerbsPl: Record<ControlKind, string> = {
  stun: "ogłusza",
  root: "unieruchamia",
  disarm: "rozbraja",
  silence: "ucisza",
};

export const controlNounsPl: Record<ControlKind, string> = {
  stun: "Ogłuszenie",
  root: "Unieruchomienie",
  disarm: "Rozbrojenie",
  silence: "Uciszenie",
};

export const resourceLabelsPl: Record<ResourceKind, string> = {
  essence: "esencji",
  action: "akcji",
};

export const deathCauseLabelsPl: Record<DeathCause, string> = {
  weapon: "broń",
  ability: "zdolność",
  none: "brak",
  bleeding: "krwawienie",
  poisoned: "zatrucie",
  burning: "podpalenie",
  stagger: "oszołomienie",
  stun: "ogłuszenie",
  root: "unieruchomienie",
  disarm: "rozbrojenie",
  slow: "spowolnienie",
  marked: "naznaczenie",
};

/** Polish plural of "runda" after a count (1 rundę / 2-4 rundy / else rund). */
export function roundsLabelPl(duration: number): string
{
  if (duration <= 0) return "";
  if (duration === 1) return "na 1 rundę";
  const lastTwo = duration % 100;
  const last = duration % 10;
  const useFew = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
  return `na ${duration} ${useFew ? "rundy" : "rund"}`;
}
