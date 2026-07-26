/**
 * Auto-classify maneuvers from a database backup into simulation triage tiers,
 * and export a review CSV. This is milestone #1 of the maneuver-analysis plan
 * (features-to-implement/combat-lab-maneuver-analysis-plan.md): a working table
 * a human then reviews and corrects before any effect authoring.
 *
 * READ-ONLY. Does not touch the database or the backup. It reads the backup's
 * `Maneuver.json` (offline, reproducible) and writes a CSV next to it / to the
 * given output path.
 *
 * Tiers (see plan §2):
 *   T1   — expressible NOW with the existing Effect model.
 *   T2b  — needs the roll-modifier engine (reroll / keep-best / extra die / die rank).
 *   T2c  — needs the contested-test engine (rzut sporny + raw skills in snapshot).
 *   T3   — likely NOT simulatable (out-of-combat subsystems: disease/poison,
 *          esencja, mana, cooldown manipulation, mounts, positional/narrative).
 *   T?   — unmatched → needs manual review.
 *
 * The classifier is deliberately conservative: T3 markers win first (never claim
 * a subsystem-dependent maneuver is simulatable), then T2c, then T2b, then T1.
 * `markers`, `scaling` and `condition` columns give the reviewer the "why".
 *
 * Usage:
 *   npx tsx scripts/classify-maneuvers.ts [backupManeuverJsonPath] [outCsvPath]
 *
 * Defaults: newest backup/<timestamp>/Maneuver.json → maneuver-classification.csv
 * in the repo root.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

// ----------------------------------------------------------------------------
// Classification vocabulary. Kept as ordered rules so priority is explicit and
// mirrors the analysis plan. Each RegExp is matched case-insensitively.
// ----------------------------------------------------------------------------

export type Tier = "T1" | "T2b" | "T2c" | "T3" | "T?";

/** Off-combat-model markers → force T3 (not simulatable) and explain why.
 * NOTE: "wytrwałość" is a real stat (= fortitude) and "Test wytrwałości o ST"
 * is now a modellable SAVE — so it is NOT a T3 marker; only actual disease/
 * poison/fatigue SUBSYSTEM words are. */
const OFF_SIM_MARKERS: { id: string; label: string; re: RegExp }[] = [
  { id: "disease", label: "choroba/trucizna/zmęczenie", re: /chorob|trucizn|zatru|zmęcz|\bstack/i },
  { id: "esencja", label: "esencja", re: /esencj/i },
  { id: "mana", label: "many/czar/zaklęcie", re: /\bmany\b|manapunkt|zaklęci|\bczar\b/i },
  { id: "cooldown", label: "cooldown/odnowienie manewru", re: /odnowieni|czas odnow|cooldown/i },
  { id: "crossManeuver", label: "interakcja z cudzym manewrem", re: /manewr\w* przeciwnik|manewru (defensywn|ofensywn)|cudzy manewr|atut przeciwnik/i },
  { id: "mount", label: "wierzchowiec/towarzysz", re: /wierzchowiec|wierzchowca|towarzysz|pupil/i },
  { id: "positional", label: "warunek pozycyjny/środowiskowy", re: /z ukrycia|za plecami|flankuj|z zaskocz|z wysokości|z powietrza|w wodzie|konno/i },
];

/** Contested test (T2c). */
const CONTESTED_RE = /\btest\b/i;

/** Roll modifiers (T2b) — anything that adds/removes/selects dice or rerolls. */
const ROLL_MOD_RE = /przerzu|rzuca dwiema|rzuć ponownie|wybiera (mniejsz|większ|wyższ|niższ)|większą z|mniejszą z|dodatkow\w+ koś|dodaje .{0,20}koś|dorzuca|rang\w+ kości|kość o randze|ponawiasz rzut|odrzuc\w* koś|usuwa\w* .{0,15}koś|koś\w* z (najwyższ|największ|najniższ|najmniejsz)|wybiera\w* .{0,15}wynik/i;

/** Expressible now with existing Effect model (T1). */
const T1_RE = /dodaje \d+ ?dmg|dodaje \d+ obraż|\+\d+ ?dmg|obrażeń równ|dodaje .{0,20}do obrażeń|podwaja obrażenia|zwiększa obrażenia|zmniejsza obrażenia|redukcj|dodaje \d+ (unik|bloku|parow|odpor|pancerz|redukcj|precyz|inicjatyw|refleks)|dodaje \d+ (wytrwałoś)?|barier|\bpwt\b|tarcz|lecz|regener|oszołomi|przewróc|powal|unieruchom|ogłusz|odepch|przyciąg|odrzuc|postaw/i;

/** Extra descriptive flags for the reviewer (do not change the tier). */
const SCALING_RE = /za każd|za \d+ (esencj|punkt)|\/\d?esencj|na każd/i;
const CONDITION_RE = /tylko przeciw|tylko gdy|jeśli |gdy |atakując z|przeciw szarż|z powietrza|w odpowiedzi/i;
const COST_RE = /\b\d+ ?h\b|punkt\w* many|za \d+ punkt|kosztuje/i;

export type Classification = {
  tier: Tier;
  markers: string[];
  scaling: boolean;
  condition: boolean;
  cost: boolean;
};

/** Classify one maneuver description into a triage tier + explanatory flags. */
export function classifyManeuver(description: string): Classification
{
  const text = description ?? "";
  const markers = OFF_SIM_MARKERS.filter(m => m.re.test(text)).map(m => m.label);

  let tier: Tier;
  if (markers.length > 0) tier = "T3";
  else if (CONTESTED_RE.test(text)) tier = "T2c";
  else if (ROLL_MOD_RE.test(text)) tier = "T2b";
  else if (T1_RE.test(text)) tier = "T1";
  else tier = "T?";

  return {
    tier,
    markers,
    scaling: SCALING_RE.test(text),
    condition: CONDITION_RE.test(text),
    cost: COST_RE.test(text),
  };
}

/**
 * Best-guess effect TYPE for the reviewer (a hint shown in the tool), so picking
 * the right editor is faster. Distinguishes a save (test vs fixed ST) from a
 * contested test, and points offence/defence/crit/roll cases at their editor.
 */
export function suggestedType(description: string): string
{
  const t = (description ?? "").toLowerCase();
  const isTest = /\btest\b/.test(t);
  const hasST = /o st\s*=|o st\b|\bst\s*=\s*\d/.test(t);
  if (isTest && hasST) return "save (test vs ST)";
  if (isTest) return "contested (test sporny)";
  if (/przerzu|dodatkow\w+ koś|rang\w+ kości|wybiera\w* .{0,15}(koś|wynik)|odrzuc\w* .{0,10}koś|ponawiasz rzut/.test(t)) return "roll (modyfikator rzutu)";
  if (/(siłę|siła|siły) krytyka|krytyczn/.test(t)) return "stat/krytyk lub warunek (przy krytyku)";
  if (/dodaje \d+ (odpor|unik|blok|parow|pancerz|niewrażliw|redukcj|precyz|inicjatyw|refleks)|barier|\bpwt\b|tarcz/.test(t)) return "stat (obrona/wzmocnienie)";
  if (/lecz|regener/.test(t)) return "heal (leczenie)";
  if (/oszołomi|ogłusz|unieruchom|przewróc|powal|rozbroj/.test(t)) return "control/status";
  if (/odepch|odrzuc|przyciąg/.test(t)) return "push/pull";
  if (/dodaje \d+ ?dmg|dodaje \d+ obraż|\dk\d|obrażeń|obrażenia/.test(t)) return "damage (obrażenia)";
  return "";
}

// ----------------------------------------------------------------------------
// Effect proposer — auto-draft `effects[]` for the mechanical, fully-inline
// cases so the reviewer edits/approves instead of authoring from scratch.
//
// Scope is deliberately narrow and HONEST:
//   • damage (dice + flat), heal, control/status, push/pull → proposed inline.
//   • stat/reduction BUFFS are NOT proposed: the Effect model's `buff` references
//     a BuffProfile by id, which can't be synthesised statically → we only flag
//     "wymaga profilu" so the reviewer authors the profile in the editor.
// Confidence:
//   • "high"   — a single clean pattern in a T1 maneuver (no test, no markers).
//   • "medium" — pattern present but gated (test sporny) or alongside other text.
//   • "none"   — nothing matched.
// Everything here is a PREVIEW column; the human reviews before anything is saved.
// ----------------------------------------------------------------------------

// Effect shapes mirror src/domain/combat-lab/effects/Effect.ts (kept as plain
// objects here so the script has no cross-module import / build dependency).
type ProposedEffect = Record<string, unknown>;

function detectDamageType(text: string): string
{
  if (/nieuchronn/i.test(text)) return "nieuchronne";
  if (/śmierteln/i.test(text)) return "śmiertelne";
  if (/bezpośredni/i.test(text)) return "bezpośrednie";
  if (/blokowan/i.test(text)) return "blokowane";
  return "zwyczajne";
}

/** Parse a Polish dice token "NkMw+B" → DamageSpec (grade = faces / 2). */
function parseDice(amount: string, faces: string, phantom: string | undefined, bonus: string | undefined): ProposedEffect
{
  const spec: ProposedEffect = {
    amount: Number(amount),
    grade: Math.round(Number(faces) / 2),
    bonus: bonus ? Number(bonus) : 0,
  };
  if (phantom) spec.isPhantom = true;
  return spec;
}

// PL pool-name stem → character field (aliases: budowa/kondycja, wytrwałość/wytrzymałość).
const POOL_DICT: { re: RegExp; group: "attributes" | "characteristics"; key: string }[] = [
  { re: /walk\w* wręcz/i, group: "attributes", key: "martialArt" },
  { re: /fechtun/i, group: "attributes", key: "fencing" },
  { re: /fortel/i, group: "attributes", key: "artifice" },
  { re: /precyz/i, group: "attributes", key: "precision" },
  { re: /inicjatyw/i, group: "attributes", key: "initiative" },
  { re: /jeźdz/i, group: "attributes", key: "horsemanship" },
  { re: /wytrwał|wytrzymał/i, group: "attributes", key: "fortitude" },
  { re: /refleks/i, group: "attributes", key: "reflex" },
  { re: /\bwol[aięąy]/i, group: "attributes", key: "willpower" },
  { re: /si[łl][aeęoyą]/i, group: "characteristics", key: "strength" },
  { re: /zręcz/i, group: "characteristics", key: "dexterity" },
  { re: /budow|kondycj/i, group: "characteristics", key: "constitution" },
  { re: /umysł/i, group: "characteristics", key: "mind" },
  { re: /charyzm/i, group: "characteristics", key: "charisma" },
  { re: /czarokrwist/i, group: "characteristics", key: "spellborn" },
];

function matchSkill(token: string): { group: string; key: string } | null
{
  for (const d of POOL_DICT) if (d.re.test(token)) return { group: d.group, key: d.key };
  return null;
}

/**
 * Parse a pool string like "walka wręcz+fortel" or "refleks/siła/walka wręcz".
 * Conservative: if it mixes "+" and "/" (ambiguous precedence, e.g.
 * "A+B/A+C"), we bail (return null) so we don't emit a wrong draft.
 */
function parsePool(str: string): { pool: ProposedEffect[]; modifier?: number; simplified?: boolean } | null
{
  const lower = str.toLowerCase().trim();

  // Ambiguous "A+B/C+D" (alternatives of sums) can't be modelled precisely by
  // the per-term `anyOf`, so take the FIRST alternative group as a draft.
  let work = lower;
  let simplified = false;
  if (lower.includes("+") && lower.includes("/"))
  {
    work = lower.split("/")[0]!.trim();
    simplified = true;
  }

  let modifier = 0;
  for (const mm of work.matchAll(/[−+\-]\s*(\d+)/g))
  {
    const sign = mm[0].trim()[0] === "+" ? 1 : -1;
    modifier += sign * Number(mm[1]);
  }
  const cleaned = work.replace(/[−+\-]\s*\d+/g, " ");

  const sep = cleaned.includes("+") ? "+" : "/";
  const parts = cleaned.split(sep).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const pool: ProposedEffect[] = [];
  if (sep === "+")
  {
    for (const p of parts) { const r = matchSkill(p); if (!r) return null; pool.push({ anyOf: [r] }); }
  }
  else
  {
    const anyOf: ProposedEffect[] = [];
    for (const p of parts) { const r = matchSkill(p); if (!r) return null; anyOf.push(r); }
    pool.push({ anyOf });
  }
  return { pool, ...(modifier ? { modifier } : {}), ...(simplified ? { simplified: true } : {}) };
}

/**
 * Parse an effect clause (the "what happens" part of a test outcome or a plain
 * maneuver) into proposed effects: damage (dice/flat), self stat buffs (uniki/
 * blok/…), statuses and control. `selfBuff` flags a defensive outcome so the
 * caller can set onWinTarget = "self".
 */
function parseClauseEffects(text: string, damageType: string): { effects: ProposedEffect[]; selfBuff: boolean }
{
  const t = text.toLowerCase();
  const effects: ProposedEffect[] = [];
  let selfBuff = false;

  // Damage: dice first, else flat.
  const dice = /(\d+)\s*k\s*(\d+)\s*(w)?/i.exec(t);
  const flat = /(?:zadaje|dodaje)\s+(\d+)\s*(?:dmg|obraż)/i.exec(t);
  if (dice) effects.push({ type: "damage", damage: parseDice(dice[1]!, dice[2]!, dice[3], undefined), damageType });
  else if (flat) effects.push({ type: "damage", damage: { amount: 0, grade: 0, bonus: Number(flat[1]) }, damageType });

  // Self stat buffs.
  const statMap: [RegExp, string][] = [
    [/dodaje\s+(\d+)\s*unik/i, "dodge"], [/dodaje\s+(\d+)\s*blok/i, "block"], [/dodaje\s+(\d+)\s*parow/i, "parry"],
    [/dodaje\s+(\d+)\s*pancerz/i, "protection"], [/dodaje\s+(\d+)\s*odpor/i, "resistance"], [/dodaje\s+(\d+)\s*niewrażliw/i, "immunity"],
    // Redukcja (flat, number-before-word) → pancerz. Used e.g. as the per-unit
    // effect of "Dodaje 1 redukcji za każdą kość… przeciwko tobie".
    [/dodaje\s+(\d+)\s*(?:do\s+)?redukcj/i, "protection"],
  ];
  const stat: ProposedEffect = { type: "stat", mode: "self", duration: 1 };
  let anyStat = false;
  for (const [re, key] of statMap) { const m = re.exec(t); if (m) { stat[key] = Number(m[1]); anyStat = true; } }
  if (anyStat) { effects.push(stat); selfBuff = true; }

  // Statuses / control.
  if (/krwawi/i.test(t)) effects.push({ type: "status", status: "bleeding", duration: 2 });
  if (/zatru|trucizn/i.test(t)) effects.push({ type: "status", status: "poisoned", duration: 2 });
  if (/podpal|płon|ogień/i.test(t)) effects.push({ type: "status", status: "burning", duration: 2 });
  if (/oszołomi/i.test(t)) effects.push({ type: "status", status: "stagger", duration: 1 });
  if (/ogłusz/i.test(t)) effects.push({ type: "control", control: "stun", duration: 1 });
  if (/unieruchom/i.test(t)) effects.push({ type: "control", control: "root", duration: 1 });
  if (/rozbroj/i.test(t)) effects.push({ type: "control", control: "disarm", duration: 1 });

  return { effects, selfBuff };
}

export type Proposal = { effects: ProposedEffect[]; confidence: "high" | "medium" | "none"; note: string };

export function proposeEffects(description: string, c: Classification): Proposal
{
  const text = description ?? "";
  const effects: ProposedEffect[] = [];
  const notes: string[] = [];

  const damageType = detectDamageType(text);
  const gated = c.tier === "T2c"; // effect is conditional on winning a contested test

  // A. Save vs fixed ST — "Test wytrwałości o ST=7. Za każde oczko straty zadaje 1dmg".
  const saveM = /test\s+wytrwałoś\w*\s+o\s+st\s*=?\s*(\d+)/i.exec(text);
  if (saveM)
  {
    const st = Number(saveM[1]);
    const after = text.slice(saveM.index + saveM[0].length);
    const scaleM = /za każd\w+ oczk\w+ (?:straty|porażki)(.+?)(?:\.|$)/i.exec(after);
    const failText = scaleM ? after.replace(scaleM[0], " ") : after;
    const onFail = parseClauseEffects(failText, damageType);
    const scale = scaleM ? parseClauseEffects(scaleM[1]!, damageType) : { effects: [], selfBuff: false };
    const eff: ProposedEffect = { type: "save", pool: { pool: [{ anyOf: [{ group: "attributes", key: "fortitude" }] }] }, st, who: "target", onFail: onFail.effects };
    if (scale.effects.length > 0) eff.perMarginOfFailure = { per: 1, effect: scale.effects[0] };
    return { effects: [eff], confidence: "medium", note: "save vs ST (wytrwałość) — sprawdź onFail/skalowanie" };
  }

  // B. Contested test — "Test [sporny] A vs B. <onWin>". Pools parsed conservatively.
  const testM = /test\s+(?:sporn\w+\s+)?(.+?)\s+vs\s+(.+?)(?:\.|$)/i.exec(text);
  if (testM)
  {
    const atk = parsePool(testM[1]!);
    const def = parsePool(testM[2]!);
    if (atk && def)
    {
      const attacker: ProposedEffect = { pool: atk.pool }; if (atk.modifier) attacker.modifier = atk.modifier;
      const defender: ProposedEffect = { pool: def.pool }; if (def.modifier) defender.modifier = def.modifier;
      const after = text.slice(testM.index + testM[0].length);

      // Split off the "za każde oczko przewagi …" scaling clause; parse the rest as onWin.
      const scaleM = /za każd\w+ oczk\w+ przewagi(.+?)(?:\.|$)/i.exec(after);
      const winText = scaleM ? after.replace(scaleM[0], " ") : after;
      const win = parseClauseEffects(winText, damageType);
      const scale = scaleM ? parseClauseEffects(scaleM[1]!, damageType) : { effects: [], selfBuff: false };

      const selfBuff = win.selfBuff || scale.selfBuff;
      const eff: ProposedEffect = { type: "contested", attacker, defender, onWin: win.effects, onWinTarget: selfBuff ? "self" : "target" };
      if (scale.effects.length > 0) eff.perMargin = { per: 1, effect: scale.effects[0] };

      const notes = ["test sporny (pule sparsowane)"];
      if (atk.simplified || def.simplified) notes.push("pula uproszczona — sprawdź alternatywy");
      if (win.effects.length === 0 && !eff.perMargin) notes.push("onWin do uzupełnienia");
      return { effects: [eff], confidence: "medium", note: notes.join("; ") };
    }
    // pools not parseable → leave for manual, continue with simple detection below
  }

  // C. Scaling — "(za|na) każd- <source>" with the effect stated before or after
  // the clause (excluding test-margin przewagi/straty, handled by contested/save).
  const scaleM = /(?:za|na) każd\S+\s+(?:(\d+)\s+)?(niewrażliw\w*|koś\w*|esencj\w*|many|manę)/i.exec(text);
  if (scaleM && !/przewagi|straty/i.test(scaleM[0]))
  {
    const per = scaleM[1] ? Number(scaleM[1]) : undefined;
    const w = scaleM[2]!.toLowerCase();
    const source: ProposedEffect | null =
      /niewrażliw/.test(w) ? { kind: "opponentImmunity" }
      : /koś/.test(w) ? { kind: "opponentDice" }
      : /esencj/.test(w) ? { kind: "selfResource", resource: "essence" }
      : null;
    if (source)
    {
      const parsed = parseClauseEffects(text, damageType); // effect may precede the clause
      if (parsed.effects.length > 0)
      {
        const eff: ProposedEffect = { type: "scale", source, effect: parsed.effects[0] };
        if (per) eff.per = per;
        return { effects: [eff], confidence: "medium", note: "skalowanie (za każde X) — sprawdź źródło i efekt" };
      }
    }
  }

  // C2. Dynamic value from a statistic — "<efekt> równ- <statystyka> [przeciwnika]"
  //     (e.g. "redukcja równa umysłowi przeciwnika", "dodaje redukcję równą sile").
  //     Modelled as a `scale` from selfStat/opponentStat with a unit base effect.
  const eqIdx = text.search(/równ\S+/i);
  if (eqIdx >= 0)
  {
    const tail = text.slice(eqIdx);
    const stat = matchSkill(tail);
    if (stat)
    {
      const opponent = /przeciwnik|wrog/i.test(tail);
      const who = opponent ? "target" : "self";

      // C2a. Dynamic dice RANK ("kość … o randze równej sile") → damage with gradeFromStat.
      // NOTE: "ranga" → locative "randze" (g→dz), so match `ran[dg]`, not `rang`.
      if (/ran[dg]\S*\s+równ/i.test(text) || /koś\S*[^.]*o\s+ran[dg]/i.test(text))
      {
        const damage: ProposedEffect = { amount: 1, grade: 0, bonus: 0, gradeFromStat: { group: stat.group, key: stat.key, who } };
        if (/widmow/i.test(text)) damage.isPhantom = true;
        return { effects: [{ type: "damage", damage, damageType }], confidence: "medium", note: "dynamiczna ranga kości (równa statystyce)" };
      }

      // C2b. Flat dynamic value ("redukcja/obrażenia równe <stat>") → scale from stat.
      const source: ProposedEffect = { kind: opponent ? "opponentStat" : "selfStat", group: stat.group, key: stat.key };
      const head = text.slice(0, eqIdx);
      const base: ProposedEffect | null =
        /redukcj/i.test(head) ? { type: "stat", mode: "self", duration: 1, protection: 1 }
        : /(obraż|dmg)/i.test(head) ? { type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType }
        : null;
      if (base)
      {
        return { effects: [{ type: "scale", source, effect: base }], confidence: "medium", note: "wartość dynamiczna (równa statystyce) — sprawdź źródło i bazę" };
      }
    }
  }

  // 1. Dice damage: "1k6w", "1k4+1", "dodaje widmową kość obrażeń k6" (implicit 1).
  const diceRe = /(\d+)\s*k\s*(\d+)\s*(w)?\s*(?:\+\s*(\d+))?/gi;
  let m: RegExpExecArray | null;
  while ((m = diceRe.exec(text)) !== null)
  {
    effects.push({ type: "damage", damage: parseDice(m[1]!, m[2]!, m[3], m[4]), damageType });
    notes.push("kość obrażeń");
  }
  // "kość obrażeń k6" / "widmową kość obrażeń k8" without a leading count → 1kX.
  // NOTE: `koś\S*` (not `koś\w*`) because JS `\w` is ASCII-only and won't consume
  // the "ć" in "kość", which broke every phantom-die maneuver.
  if (effects.length === 0)
  {
    const loneDie = /koś\S*\s+(?:obrażeń\s+)?(?:od\s+\w+\s+)?k\s*(\d+)\s*(w)?/i.exec(text);
    if (loneDie)
    {
      const phantom = loneDie[2] ?? (/widmow/i.test(text) ? "w" : undefined);
      effects.push({ type: "damage", damage: parseDice("1", loneDie[1]!, phantom, undefined), damageType });
      notes.push(phantom ? "widmowa kość obrażeń" : "pojedyncza kość obrażeń");
    }
  }

  // 2. Flat damage: "dodaje 3 dmg", "dodaje 5 obrażeń", "+3 dmg", "zadaje 2 ... obrażeń".
  const flat = /(?:dodaje|zadaje|zwiększa o)\s+(\d+)\s*(?:dodatkow\w+\s+|nieuchronn\w+\s+|bezpośredni\w+\s+)?(?:dmg|obraż)/i.exec(text)
    ?? /\+\s*(\d+)\s*dmg/i.exec(text);
  if (flat) { effects.push({ type: "damage", damage: { amount: 0, grade: 0, bonus: Number(flat[1]) }, damageType }); notes.push("płaskie obrażenia"); }

  // 3. Heal: "leczy 5", "odzyskuje 3 zdrowia".
  const heal = /(?:leczy|odzyskuj\w*|regeneruj\w*)\s+(\d+)/i.exec(text);
  if (heal) { effects.push({ type: "heal", amount: { amount: 0, grade: 0, bonus: Number(heal[1]) } }); notes.push("leczenie"); }

  // 4. Control / status (duration 1 round by default).
  if (/ogłusz/i.test(text)) { effects.push({ type: "control", control: "stun", duration: 1 }); notes.push("ogłuszenie→stun"); }
  if (/unieruchom/i.test(text)) { effects.push({ type: "control", control: "root", duration: 1 }); notes.push("unieruchomienie→root"); }
  if (/rozbroj/i.test(text)) { effects.push({ type: "control", control: "disarm", duration: 1 }); notes.push("rozbrojenie→disarm"); }
  if (/oszołomi/i.test(text)) { effects.push({ type: "status", status: "stagger", duration: 1 }); notes.push("oszołomienie→stagger"); }

  // 5. Movement — only when an explicit step distance is present, to avoid
  //    false positives like "odrzuca kość" (a dice discard, not a knockback).
  const steps = /(\d+)\s*krok/i.exec(text);
  if (steps)
  {
    if (/odpych\w*|odepch\w*|odrzuc\w*/i.test(text)) { effects.push({ type: "push", distance: Number(steps[1]) }); notes.push("odepchnięcie"); }
    if (/przyciąg\w*/i.test(text)) { effects.push({ type: "pull", distance: Number(steps[1]) }); notes.push("przyciągnięcie"); }
  }

  // 6. Inline stat buff / defense (self): "dodaje N odporności/uniku/bloku…"
  //    → a `stat` effect (no BuffProfile needed). Duration is guessed at 1 round.
  const statSpecs: { re: RegExp; key: string }[] = [
    { re: /dodaje\s+(\d+)\s*odpor/i, key: "resistance" },
    { re: /dodaje\s+(\d+)\s*unik/i, key: "dodge" },
    { re: /dodaje\s+(\d+)\s*blok/i, key: "block" },
    { re: /dodaje\s+(\d+)\s*parow/i, key: "parry" },
    { re: /dodaje\s+(\d+)\s*pancerz/i, key: "protection" },
    { re: /dodaje\s+(\d+)\s*niewrażliw/i, key: "immunity" },
    { re: /dodaje\s+(\d+)\s*(?:pwt|barier)/i, key: "barrier" },
    { re: /dodaje\s+(\d+)\s*precyz/i, key: "precision" },
    { re: /dodaje\s+(\d+)\s*inicjatyw/i, key: "initiative" },
    { re: /dodaje\s+(\d+)\s*refleks/i, key: "reflex" },
    // "Zmniejsza obrażenia o N" (but NOT "o N%", where the digit is followed by
    // another digit or a percent sign) → flat reduction ≈ pancerz.
    { re: /zmniejsza\s+obrażenia\s+o\s+(\d+)(?![\d%])/i, key: "protection" },
    // "Zwiększa o N rangi kości broni…" → +N do rangi kości broni (diceGrade).
    { re: /zwiększa\s+o\s+(\d+)\s*rang\w*\s+kości\s+broni/i, key: "diceGrade" },
  ];
  // Redukcja (flat) → pancerz, but ONLY when the maneuver is not about removing
  // dice ("redukcję N kości"), whose trailing "dodaje N redukcji" scaling clause
  // would otherwise be misread as flat pancerz.
  if (!/redukcj\w*\s+\d+\s*kości/i.test(text))
  {
    statSpecs.push({ re: /(?:dodaje|zwiększa redukcję o)\s+(\d+)\s*(?:do\s+)?redukcj/i, key: "protection" });
  }
  const statEffect: ProposedEffect = { type: "stat", mode: "self", duration: 1 };
  let anyStat = false;
  for (const { re, key } of statSpecs)
  {
    const sm = re.exec(text);
    if (sm) { statEffect[key] = Number(sm[1]); anyStat = true; }
  }
  // Crit power: "zwiększa siłę krytyka o N" / "siła krytyka +N" (not "zamiast siły krytyka").
  if (!/zamiast (siły|siły) krytyka/i.test(text))
  {
    const crit = /(?:zwiększa|dodaje|podnosi)\s+si[łl][ęy] krytyka(?:\s+o)?\s*\+?(\d+)|si[łl]a krytyka\s*\+(\d+)/i.exec(text);
    if (crit) { statEffect.critPower = Number(crit[1] ?? crit[2]); anyStat = true; }
  }
  // Crit chance (szansa/zasięg krytyka): "dodaje szansę krytyka(+N)". No number → +1.
  // NOTE: `szans\S*` (not `\w`) — JS `\w` is ASCII-only and won't consume "ę".
  const critChance = /(?:dodaje|zwiększa|podnosi)\s+szans\S*\s+krytyka\s*(?:o\s*)?(?:\+\s*)?(\d+)?/i.exec(text);
  if (critChance) { statEffect.critRange = critChance[1] ? Number(critChance[1]) : 1; anyStat = true; }
  // Crit disabled: "nie można zadać krytycznych obrażeń" / "bez krytyka".
  if (/nie można[^.]*kryt|nie zadaj\S*[^.]*kryt|bez (?:możliwości )?kryt/i.test(text)) { statEffect.critDisabled = true; anyStat = true; }
  if (anyStat) { effects.push(statEffect); notes.push("wzmocnienie/obrona (na siebie, czas=1 — sprawdź)"); }

  // 6.4 Stance/state rank bump — "podnosisz rangę postaw(y)/stanu o N".
  if (effects.length === 0)
  {
    const rankM = /rang\S*\s+(postaw\S*|stan\S*)\s+o\s+(\d+)/i.exec(text);
    if (rankM)
    {
      const target = /postaw/i.test(rankM[1]!) ? "stance" : "state";
      effects.push({ type: "stanceRank", target, delta: Number(rankM[2]), duration: 1 });
      notes.push("zmiana rangi postawy/stanu (czas=1 — sprawdź)");
    }
  }

  // 6.5 Multipliers (procent / mnożnik). Standalone only (avoid clashing with
  //     flat stat/damage). Percent reduces incoming (damageTaken); doubling
  //     amplifies outgoing (damageDealt).
  if (effects.length === 0)
  {
    const pctDown = /zmniejsza\s+obrażenia\s+o\s+(\d+)\s*%/i.exec(text);
    const pctUp = /zwiększa\s+obrażenia\s+o\s+(\d+)\s*%/i.exec(text);
    if (pctDown)
    {
      const f = Math.round((1 - Number(pctDown[1]) / 100) * 100) / 100;
      effects.push({ type: "multiplier", mode: "self", target: "damageTaken", factor: f, rounding: "up", duration: 1 });
      notes.push("procent: −obrażenia otrzymywane (sprawdź czas/tryb)");
    }
    else if (pctUp)
    {
      const f = Math.round((1 + Number(pctUp[1]) / 100) * 100) / 100;
      effects.push({ type: "multiplier", mode: "self", target: "damageDealt", factor: f, rounding: "up", duration: 1 });
      notes.push("procent: +obrażenia zadawane (sprawdź czas/tryb)");
    }
    else if (/potraja\s+obrażenia/i.test(text))
    {
      effects.push({ type: "multiplier", mode: "self", target: "damageDealt", factor: 3, rounding: "up", duration: 1 });
      notes.push("×3 obrażenia zadawane (sprawdź warunek/czas)");
    }
    else if (/podwaja\s+obrażenia/i.test(text))
    {
      effects.push({ type: "multiplier", mode: "self", target: "damageDealt", factor: 2, rounding: "up", duration: 1 });
      notes.push("×2 obrażenia zadawane (sprawdź warunek/czas — często zależne)");
    }
  }

  // 7. Roll modifiers (T2b) on THIS attack. Conservative, high-precision:
  //    an extra WEAPON die (not damage die), or a reroll → advantage. Only when
  //    no other effect matched, to avoid muddying damage/stat proposals.
  if (effects.length === 0)
  {
    if (/(?:dodaj\w*|rzucasz)\s+(?:jedn\w+\s+)?dodatkow\w+\s+koś\S*\s+broni/i.test(text))
    {
      effects.push({ type: "roll", modifier: "extraDie" });
      notes.push("dodatkowa kość broni → roll:extraDie (ranga domyślna k6 — sprawdź)");
    }
    else if (/przerzut|ponawiasz rzut|rzuć ponownie|rzuca\w* ponownie/i.test(text))
    {
      effects.push({ type: "roll", modifier: "advantage" });
      notes.push("przerzut → roll:advantage (przybliżenie — sprawdź warunek)");
    }
  }

  if (effects.length === 0) return { effects: [], confidence: "none", note: notes.join("; ") };

  // Gate the whole proposal behind the contested test if this is T2c.
  const confidence: Proposal["confidence"] = gated || effects.length > 1 || c.scaling ? "medium" : (c.tier === "T1" ? "high" : "medium");
  if (gated) notes.push("UWAGA: efekt zależny od wygranego testu spornego (owinąć w test)");
  if (c.scaling) notes.push("UWAGA: opis wskazuje skalowanie (za każde/za N) — sprawdź wartości");

  return { effects, confidence, note: notes.join("; ") };
}

// ----------------------------------------------------------------------------
// CSV helpers (UTF-8 BOM so Excel reads Polish characters correctly).
// ----------------------------------------------------------------------------

function csvCell(value: string | number | boolean): string
{
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, string | number | boolean>[]): string
{
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map(h => csvCell(row[h] ?? "")).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

// ----------------------------------------------------------------------------
// Backup discovery.
// ----------------------------------------------------------------------------

function newestBackupManeuverJson(): string
{
  const backupRoot = join(process.cwd(), "backup");
  if (!existsSync(backupRoot)) throw new Error(`Nie znaleziono katalogu backup/ w ${process.cwd()}`);
  const dirs = readdirSync(backupRoot)
    .filter(d => existsSync(join(backupRoot, d, "Maneuver.json")))
    .sort()
    .reverse();
  if (dirs.length === 0) throw new Error("Żaden backup/<timestamp>/Maneuver.json nie istnieje.");
  return join(backupRoot, dirs[0]!, "Maneuver.json");
}

// ----------------------------------------------------------------------------
// Main.
// ----------------------------------------------------------------------------

type ManeuverRecord = { name: string; grade: number; description: string; tags?: string[]; requirements?: string[] };

/** Classify one JSON file of {name,grade,description,tags} records → a review CSV. */
function classifyFile(inPath: string, outPath: string, label: string): void
{
  const records = JSON.parse(readFileSync(inPath, "utf8")) as ManeuverRecord[];
  const withDescription = records.filter(r => r.description && r.description.trim().length > 0);

  const rows = withDescription
    .map(r =>
    {
      const c = classifyManeuver(r.description);
      const p = proposeEffects(r.description, c);
      return {
        name: r.name,
        grade: r.grade,
        tier: c.tier,
        suggestedType: suggestedType(r.description),
        markers: c.markers.join("; "),
        scaling: c.scaling ? "tak" : "",
        condition: c.condition ? "tak" : "",
        cost: c.cost ? "tak" : "",
        proposalConfidence: p.confidence === "none" ? "" : p.confidence,
        proposedEffects: p.effects.length > 0 ? JSON.stringify(p.effects) : "",
        proposalNote: p.note,
        // Reviewer fills this in: "tak" to import proposedEffects for this row
        // (see scripts/import-maneuver-effects.ts). Leave blank to skip.
        approve: "",
        tags: (r.tags ?? []).join("; "),
        description: r.description,
      };
    })
    .sort((a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name, "pl"));

  writeFileSync(outPath, toCsv(rows), "utf8");

  const byTier = new Map<Tier, number>();
  for (const row of rows) byTier.set(row.tier as Tier, (byTier.get(row.tier as Tier) ?? 0) + 1);
  const total = rows.length || 1;
  const order: Tier[] = ["T1", "T2b", "T2c", "T3", "T?"];

  console.log(`\n=== ${label} ===`);
  console.log(`Wejście: ${inPath}`);
  console.log(`Rekordów z opisem: ${rows.length} (z ${records.length})`);
  console.log("Rozkład tierów: " + order.map(t => `${t} ${byTier.get(t) ?? 0}`).join(" · "));
  const withProposal = rows.filter(r => r.proposedEffects !== "").length;
  const high = rows.filter(r => r.proposalConfidence === "high").length;
  const medium = rows.filter(r => r.proposalConfidence === "medium").length;
  console.log(`Auto-propozycje: ${withProposal} (${((100 * withProposal) / total).toFixed(1)}%)  [high ${high} · medium ${medium}]`);
  console.log(`CSV → ${outPath}`);
}

function main(): void
{
  const inPath = process.argv[2] ?? newestBackupManeuverJson();
  const outPath = process.argv[3] ?? join(process.cwd(), "maneuver-classification.csv");

  classifyFile(inPath, outPath, "Manewry");

  // Also classify stances/states if their JSON sits beside the maneuver file
  // (same backup folder). Separate CSVs — import them into Stance/State records.
  const dir = dirname(inPath);
  for (const [file, label] of [["Stance.json", "Postawy"], ["State.json", "Stany"]] as const)
  {
    const p = join(dir, file);
    if (existsSync(p))
    {
      const out = join(dirname(outPath), `${label.toLowerCase()}-classification.csv`);
      classifyFile(p, out, label);
    }
  }
}

// Run as a CLI only when invoked directly (allows importing the exports above
// from an analysis script without triggering the file-writing main()).
if (process.argv[1] && /classify-maneuvers\.ts$/.test(process.argv[1])) main();
