/**
 * Metadata driving the in-app maneuver effect editor: per-type field lists,
 * enum options with Polish labels, and default objects. Single source of truth
 * shared by the editor components — Polish vocabulary reuses the domain i18n
 * maps where possible so nothing drifts from the simulator/replay.
 */

import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { statusLabelsPl, controlNounsPl } from "@/domain/combat-lab/i18n/labels";

export type FieldKind = "number" | "check" | "enum" | "text";

export type FieldDef =
{
  /** Dot path relative to the effect object, e.g. "damage.bonus". */
  path: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  optLabels?: Record<string, string>;
  /** Default when the effect is created / type switched. */
  def?: number | boolean | string;
};

export const DAMAGE_TYPES = ["zwyczajne", "blokowane", "bezpośrednie", "śmiertelne", "nieuchronne"] as const;
export const STATUS_IDS = ["bleeding", "poisoned", "burning", "stagger", "stun", "root", "disarm", "slow", "marked"] as const;
export const CONTROL_KINDS = ["stun", "root", "disarm", "silence"] as const;
export const RESOURCE_KINDS = ["essence", "action"] as const;
export const RESOURCE_LABELS: Record<string, string> = { essence: "esencja", action: "akcja" };
export const ROLL_MODIFIERS = ["advantage", "disadvantage", "extraDie"] as const;
export const ROLL_MOD_LABELS: Record<string, string> = { advantage: "przewaga (2 rzuty, wyższy)", disadvantage: "utrudnienie (2 rzuty, niższy)", extraDie: "dodatkowa kość" };
export const STAT_MODE_LABELS: Record<string, string> = { self: "na siebie (wzmocnienie)", target: "na cel (osłabienie)" };
export const MULTIPLIER_TARGETS = ["damageDealt", "damageTaken"] as const;
export const MULTIPLIER_TARGET_LABELS: Record<string, string> = { damageDealt: "zadawane obrażenia", damageTaken: "otrzymywane obrażenia" };
export const ROUNDING_KINDS = ["up", "down", "nearest"] as const;
export const ROUNDING_LABELS: Record<string, string> = { up: "w górę", down: "w dół", nearest: "do najbliższego" };

/**
 * All character skills usable in test pools: `[group, key, PL]`.
 * Canonical source moved to `@/domain/characters/statistics/skills` so it can be
 * shared with the domain-level requirements engine; re-exported here to keep the
 * existing Combat Lab editor imports (`SKILLS` from this module) working.
 */
export { SKILLS } from "@/domain/characters/statistics/skills";
export const ATTACK_KINDS = ["melee", "rangedPhysical", "rangedMagic"] as const;
export const ATTACK_KIND_LABELS: Record<string, string> = { melee: "walka wręcz", rangedPhysical: "dystans fizyczny", rangedMagic: "dystans magiczny" };
export const CONDITION_KINDS = ["opponentAttackKind", "targetHasStatus", "selfHasStatus", "onCritical", "onDamageDealt", "selfAirborne", "opponentCharging", "hasResource"] as const;
export const CONDITION_LABELS: Record<string, string> = {
  opponentAttackKind: "tylko przeciw (rodzaj ataku)", targetHasStatus: "gdy cel ma status", selfHasStatus: "gdy masz status",
  onCritical: "przy trafieniu krytycznym", onDamageDealt: "gdy zadano obrażenia",
  selfAirborne: "atakując z powietrza", opponentCharging: "tylko przeciw szarży", hasResource: "gdy masz zasób (≥)",
};
export const RESOURCE_POOL_KINDS = ["essence"] as const;
export const RESOURCE_POOL_LABELS: Record<string, string> = { essence: "esencja" };
export const SCALE_SOURCE_KINDS = ["selfDice", "opponentDice", "opponentImmunity", "selfResource", "selfStatusStacks", "targetStatusStacks", "selfStat", "opponentStat"] as const;
export const SCALE_SOURCE_LABELS: Record<string, string> = {
  selfDice: "twoja kość broni", opponentDice: "kość przeciwnika", opponentImmunity: "niewrażliwość wroga", selfResource: "twój zasób",
  selfStatusStacks: "twój stack statusu", targetStatusStacks: "stack statusu celu",
  selfStat: "twoja statystyka", opponentStat: "statystyka przeciwnika",
};

const statusOptLabels = Object.fromEntries(STATUS_IDS.map(s => [s, statusLabelsPl[s]]));
const controlOptLabels = Object.fromEntries(CONTROL_KINDS.map(c => [c, controlNounsPl[c]]));

/** Effect types offered in the editor. `simple` = fully field-driven here;
 * complex types (contested/save/when/chance/custom/buff/debuff) get dedicated
 * or JSON editors (later stages). */
export type EffectTypeMeta = { label: string; simple: boolean; fields?: FieldDef[] };

export const EFFECT_TYPE_META: Record<string, EffectTypeMeta> = {
  damage: { label: "Obrażenia", simple: true, fields: [
    { path: "damage.amount", label: "liczba kości", kind: "number", def: 0 },
    { path: "damage.grade", label: "ranga (k = ranga×2)", kind: "number", def: 0 },
    { path: "damage.bonus", label: "bonus", kind: "number", def: 0 },
    { path: "damage.isPhantom", label: "widmowa (w)", kind: "check", def: false },
    { path: "damageType", label: "kategoria", kind: "enum", options: DAMAGE_TYPES, def: "zwyczajne" },
    { path: "canCrit", label: "może trafić krytycznie", kind: "check", def: false },
  ] },
  heal: { label: "Leczenie", simple: true, fields: [
    { path: "amount.amount", label: "liczba kości", kind: "number", def: 0 },
    { path: "amount.grade", label: "ranga", kind: "number", def: 0 },
    { path: "amount.bonus", label: "bonus", kind: "number", def: 0 },
  ] },
  stat: { label: "Wzmocnienie / Obrona", simple: true, fields: [
    { path: "mode", label: "na kogo", kind: "enum", options: ["self", "target"], optLabels: STAT_MODE_LABELS, def: "self" },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
    { path: "block", label: "blok", kind: "number" }, { path: "parry", label: "parowanie", kind: "number" },
    { path: "dodge", label: "unik", kind: "number" }, { path: "protection", label: "pancerz", kind: "number" },
    { path: "resistance", label: "odporność", kind: "number" }, { path: "immunity", label: "niewrażliwość", kind: "number" },
    { path: "damage", label: "obrażenia", kind: "number" }, { path: "diceGrade", label: "ranga kości", kind: "number" },
    { path: "critPower", label: "siła krytyka", kind: "number" }, { path: "critRange", label: "szansa krytyka", kind: "number" },
    { path: "critDisabled", label: "nie może krytować", kind: "check", def: false },
    { path: "precision", label: "precyzja", kind: "number" },
    { path: "reflex", label: "refleks", kind: "number" }, { path: "initiative", label: "inicjatywa", kind: "number" },
    { path: "barrier", label: "bariera", kind: "number" },
  ] },
  multiplier: { label: "Mnożnik obrażeń (%)", simple: true, fields: [
    { path: "mode", label: "na kogo", kind: "enum", options: ["self", "target"], optLabels: STAT_MODE_LABELS, def: "self" },
    { path: "target", label: "co mnoży", kind: "enum", options: MULTIPLIER_TARGETS, optLabels: MULTIPLIER_TARGET_LABELS, def: "damageDealt" },
    { path: "factor", label: "mnożnik (2 = ×2, 0.9 = −10%)", kind: "number", def: 1 },
    { path: "rounding", label: "zaokrąglenie", kind: "enum", options: ROUNDING_KINDS, optLabels: ROUNDING_LABELS, def: "up" },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
  ] },
  forbidTag: { label: "Blokada tagu (np. Amok)", simple: true, fields: [
    { path: "tag", label: "tag z biblioteki (np. defensywa)", kind: "text", def: "defensywa" },
    { path: "scope", label: "co blokuje", kind: "enum", options: ["all", "maneuvers", "stances"], optLabels: { all: "postawy i manewry", maneuvers: "manewry", stances: "postawy" }, def: "all" },
    { path: "duration", label: "czas (0 = póki trwa tryb)", kind: "number", def: 0 },
  ] },
  stanceRank: { label: "Ranga postawy/stanu", simple: true, fields: [
    { path: "target", label: "co", kind: "enum", options: ["stance", "state"], optLabels: { stance: "postawa", state: "stan" }, def: "stance" },
    { path: "delta", label: "o ile (+/-)", kind: "number", def: 1 },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
  ] },
  roll: { label: "Modyfikator rzutu", simple: true, fields: [
    { path: "modifier", label: "rodzaj", kind: "enum", options: ROLL_MODIFIERS, optLabels: ROLL_MOD_LABELS, def: "advantage" },
    { path: "grade", label: "ranga kości (dodatkowa)", kind: "number" },
  ] },
  status: { label: "Status", simple: true, fields: [
    { path: "status", label: "status", kind: "enum", options: STATUS_IDS, optLabels: statusOptLabels, def: "bleeding" },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
    { path: "stacks", label: "stacki (opc.)", kind: "number" },
  ] },
  control: { label: "Kontrola", simple: true, fields: [
    { path: "control", label: "rodzaj", kind: "enum", options: CONTROL_KINDS, optLabels: controlOptLabels, def: "stun" },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
  ] },
  push: { label: "Odepchnięcie", simple: true, fields: [{ path: "distance", label: "kroki", kind: "number", def: 1 }] },
  pull: { label: "Przyciągnięcie", simple: true, fields: [{ path: "distance", label: "kroki", kind: "number", def: 1 }] },
  resource: { label: "Zasób", simple: true, fields: [
    { path: "resource", label: "zasób", kind: "enum", options: RESOURCE_KINDS, optLabels: RESOURCE_LABELS, def: "essence" },
    { path: "delta", label: "zmiana (+/-)", kind: "number", def: 0 },
  ] },
  buff: { label: "Buff z profilu (zaawansowane)", simple: true, fields: [
    { path: "profile.profileId", label: "id profilu buffów", kind: "text", def: "" },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
  ] },
  debuff: { label: "Debuff z profilu (zaawansowane)", simple: true, fields: [
    { path: "profile.profileId", label: "id profilu buffów", kind: "text", def: "" },
    { path: "duration", label: "czas (rundy)", kind: "number", def: 1 },
  ] },
  // Complex types — dedicated builders / JSON.
  contested: { label: "Test sporny", simple: false },
  save: { label: "Test vs stałe ST (save)", simple: false },
  when: { label: "Warunek (tylko gdy…)", simple: false },
  scale: { label: "Skalowanie (za każde X)", simple: false },
  chance: { label: "Szansa (%)", simple: false },
  custom: { label: "Własny (plugin)", simple: false },
};

/** Build a default effect object for a type (used on create / type switch). */
export function defaultEffect(type: string): Record<string, unknown>
{
  switch (type)
  {
    case "damage": return { type, damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" };
    case "heal": return { type, amount: { amount: 0, grade: 0, bonus: 1 } };
    case "stat": return { type, mode: "self", duration: 1 };
    case "multiplier": return { type, mode: "self", target: "damageDealt", factor: 1, rounding: "up", duration: 1 };
    case "stanceRank": return { type, target: "stance", delta: 1, duration: 1 };
    // Wave 9.0: the library tag is `defensywa` across all five collections.
    // `forbidTag` compares by name at simulation time, so a stale default here
    // would author a block that silently never fires.
    case "forbidTag": return { type, tag: "defensywa", scope: "all", duration: 0 };
    case "roll": return { type, modifier: "advantage" };
    case "status": return { type, status: "bleeding", duration: 1 };
    case "control": return { type, control: "stun", duration: 1 };
    case "push": case "pull": return { type, distance: 1 };
    case "resource": return { type, resource: "essence", delta: 0 };
    case "contested": return { type, attacker: { pool: [{ anyOf: [{ group: "attributes", key: "fencing" }] }] }, defender: { pool: [{ anyOf: [{ group: "attributes", key: "reflex" }] }] }, onWin: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 2 }, damageType: "zwyczajne" }], onWinTarget: "target" };
    case "save": return { type, pool: { pool: [{ anyOf: [{ group: "attributes", key: "fortitude" }] }] }, st: 7, who: "target", onFail: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" }] };
    case "when": return { type, condition: { kind: "opponentAttackKind", value: "melee" }, then: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" }] };
    case "scale": return { type, source: { kind: "opponentDice" }, effect: { type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" } };
    case "chance": return { type, chance: 50, then: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" }] };
    case "buff": case "debuff": return { type, profile: { profileId: "" }, duration: 1 };
    case "custom": return { type, effectType: "", data: {} };
    default: return { type };
  }
}

/**
 * Preset for the common "za każdą kość broni +1 obrażenie" case — a `ScaleEffect`
 * over `selfDice` with `per: 1` wrapping a flat +1 damage effect. One click instead
 * of: add effect → switch type to Skalowanie → switch source to "twoja kość broni" →
 * set per → set damage bonus. (The underlying mechanic already existed in the engine
 * and in `ScaleFields` below — this just shortcuts the most common configuration.)
 */
export function weaponDiceDamageScalePreset(): Record<string, unknown>
{
  return { type: "scale", source: { kind: "selfDice" }, per: 1, effect: { type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne", canCrit: false } };
}

export const EFFECT_TYPE_ORDER = Object.keys(EFFECT_TYPE_META);

/** Cast helper: our effect objects are built loosely and validated by Zod. */
export type LooseEffect = Record<string, unknown> & { type: string };
export const asEffects = (list: LooseEffect[]): Effect[] => list as unknown as Effect[];
