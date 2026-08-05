import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import type { AnyOfOption, Requirement } from '@/domain/requirements/Requirement';

/**
 * Polish inflects heavily: the description says „fintowaniu" while the maneuver
 * is called „Finta". Comparing whole words finds nothing, so words are matched
 * on a shared stem instead. Four characters is short enough to survive most
 * endings and long enough that „wal" does not match everything.
 */
const MIN_STEM_LENGTH = 4;

/**
 * Ranks of one entry are the same choice repeated. Two are enough to show the
 * model that the entry scales and what the next step costs.
 */
const MAX_GRADES_PER_NAME = 2;

/**
 * Share of the budget reserved for entries that other entries require.
 * Prerequisites are useless on their own, so they are filled after the
 * substantive picks rather than competing with them.
 */
const PREREQUISITE_BUDGET_SHARE = 0.15;

const NAME_WEIGHT = 8;
const TAG_WEIGHT = 3;
const DESCRIPTION_WEIGHT = 1;
const MAX_DESCRIPTION_HITS = 3;

export type CatalogSelectionQuota = {
  /** Entries of this kind always offered, even when nothing matches. */
  min: number;
  /** Ceiling once matches are counted. */
  max: number;
};

export type CatalogSelectionInput = {
  entries: readonly CharacterGenerationCatalogEntry[];
  query: string;
  quotas: Readonly<Record<string, CatalogSelectionQuota>>;
  defaultQuota: CatalogSelectionQuota;
  budgetChars: number;
  /**
   * Entries that must be offered whatever they score — in practice everything
   * the reference characters hold. Telling a model to follow the references
   * while withholding the entries they are built from asks for the impossible:
   * both references carried the ordinary defensive and offensive stance, and
   * neither survived relevance scoring against a description that never uses
   * those words.
   */
  pinnedIds?: ReadonlySet<string>;
  /**
   * Structured requirements of every catalog entry that has any, keyed by
   * identifier. Optional: without it the selection is offered as it stands, and
   * entries whose prerequisites did not fit go out with it.
   */
  requirementsById?: ReadonlyMap<string, readonly Requirement[]>;
};

const nameKey = (name: string) => name.trim().toLowerCase();

function stripDiacritics(text: string): string
{
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function tokenize(text: string): string[]
{
  const words = stripDiacritics(text.toLowerCase())
    .split(/[^\p{Letter}\p{Number}]+/u)
    .filter(word => word.length >= MIN_STEM_LENGTH);

  return [...new Set(words)];
}

function sharesStem(left: string, right: string): boolean
{
  const limit = Math.min(left.length, right.length);
  if (limit < MIN_STEM_LENGTH) return false;

  let shared = 0;
  while (shared < limit && left[shared] === right[shared]) shared++;

  return shared >= MIN_STEM_LENGTH;
}

function countMatches(queryTokens: readonly string[], candidateText: string): number
{
  const candidateTokens = tokenize(candidateText);

  return queryTokens.filter(token => candidateTokens.some(candidate => sharesStem(token, candidate))).length;
}

export function scoreCatalogEntry(entry: CharacterGenerationCatalogEntry, queryTokens: readonly string[]): number
{
  if (queryTokens.length === 0) return 0;

  const nameScore = countMatches(queryTokens, entry.name) * NAME_WEIGHT;
  const tagScore = countMatches(queryTokens, (entry.tags ?? []).join(' ')) * TAG_WEIGHT;
  const descriptionScore = Math.min(
    countMatches(queryTokens, entry.description ?? ''),
    MAX_DESCRIPTION_HITS,
  ) * DESCRIPTION_WEIGHT;

  return nameScore + tagScore + descriptionScore;
}

type ScoredEntry = {
  score: number;
  entry: CharacterGenerationCatalogEntry;
  /** This exact rank is the cheapest one that answers some entry's demand. */
  satisfies?: boolean;
};

/**
 * Cheaper and lower-ranked records come first among equals: they are the
 * entry-level versions a freshly written character can actually meet, and
 * offering „Finta" before „Finta III" keeps the draft buildable.
 *
 * The exception is the rank something else demands. Ranks of one name all score
 * the same, so ascending order alone spent the budget on ranks 1 and 2 and left
 * the rank 6 that a chosen maneuver required unoffered — the model then held
 * „Większy Fortel" at 5 against a requirement for 6.
 */
function compareEntries(left: ScoredEntry, right: ScoredEntry): number
{
  if (left.score !== right.score) return right.score - left.score;

  if (Boolean(left.satisfies) !== Boolean(right.satisfies)) return left.satisfies ? -1 : 1;

  const gradeDifference = (left.entry.grade ?? 0) - (right.entry.grade ?? 0);
  if (gradeDifference !== 0) return gradeDifference;

  const priceDifference = (left.entry.price ?? 0) - (right.entry.price ?? 0);
  if (priceDifference !== 0) return priceDifference;

  return left.entry.name.localeCompare(right.entry.name);
}

/**
 * The whole compendium does not fit in a prompt, and sending none of it is what
 * made the model invent equipment and turn „Finta" into a made-up talent. This
 * picks the records worth offering for one description and stops at a character
 * budget the caller derives from what the rest of the context already costs.
 */
/**
 * Names that other entries demand by rank, read out of requirement text such as
 * „Większy Fortel ≥ 6". Those ranks must stay selectable: a requirement the
 * model can read but cannot satisfy — because only ranks 1 and 2 of a
 * twelve-rank perk were offered — reads to it as an impossible entry, and it
 * quietly picks something weaker instead.
 */
function collectRequirementDemands(entries: readonly CharacterGenerationCatalogEntry[]): Map<string, Set<number>>
{
  const demands = new Map<string, Set<number>>();

  for (const entry of entries) {
    for (const requirement of entry.requirements ?? []) {
      // „Większy Fechtunek ≥ 5 lub Większy Fortel ≥ 5" is two demands, and
      // reading only the first left the alternative unofferable — which is the
      // same as not offering the entry at all, since either one would do.
      for (const clause of requirement.split(/[;,]|\slub\s/)) {
        const named = /^\s*(.+?)\s*≥\s*(\d+)/.exec(clause);
        if (!named) continue;

        const key = nameKey(named[1]);
        const ranks = demands.get(key) ?? new Set<number>();
        ranks.add(Number(named[2]));
        demands.set(key, ranks);
      }
    }
  }

  return demands;
}

/**
 * The records that actually answer the demands: for each demanded rank, the
 * cheapest rank of that name which meets it. Nothing else does the model any
 * good — a rank below the demand does not satisfy it, and a rank above it is
 * the same answer at a higher price.
 */
function findDemandSatisfiers(entries: readonly CharacterGenerationCatalogEntry[]): Set<string>
{
  const demands = collectRequirementDemands(entries);
  const satisfiers = new Set<string>();

  for (const [name, ranks] of demands) {
    const ofName = entries
      .filter(entry => nameKey(entry.name) === name)
      .sort((left, right) => (left.grade ?? 0) - (right.grade ?? 0));

    for (const rank of ranks) {
      const cheapest = ofName.find(entry => (entry.grade ?? 0) >= rank);
      if (cheapest) satisfiers.add(cheapest.id);
    }
  }

  return satisfiers;
}

/**
 * Groups whose requirement can be met by holding another compendium entry.
 *
 * `talents` is deliberately absent: a talent is written on the sheet, not drawn
 * from a collection, so its absence from the catalog says nothing about whether
 * the character can have it.
 */
const ENTRY_BACKED_GROUPS = new Set(['maneuvers', 'stances', 'states', 'spells', 'perks']);

/**
 * Whether one requirement could be met from what is on offer.
 *
 * Anything this cannot read counts as satisfiable. The question being answered
 * is „may this entry be removed", and removing an option on the strength of a
 * requirement we did not understand is the more expensive mistake.
 */
function isSatisfiable(
  requirement: Requirement | AnyOfOption,
  bestGradeByName: ReadonlyMap<string, number>,
): boolean
{
  if (requirement.kind === 'anyOf') {
    return requirement.options.some(option => isSatisfiable(option, bestGradeByName));
  }

  if (requirement.kind !== 'ranked' || !ENTRY_BACKED_GROUPS.has(requirement.group)) return true;

  return (bestGradeByName.get(nameKey(requirement.targetKey)) ?? -1) >= requirement.value;
}

/**
 * Removes entries whose prerequisites are not in the selection.
 *
 * Such an entry is a trap rather than an option: „Wir Ostrzy" demands „Taniec
 * Ostrzy" and „Podwójne Uderzenie", and a model shown the first without the
 * other two can only take it unsupported or leave a gap where a maneuver should
 * be. Fourteen of them reached one review this way.
 *
 * It runs to a fixed point because removing one entry can strand another that
 * depended on it, and reads STRUCTURED requirements rather than the prose the
 * model sees: the compendium holds a weapon called „Walka Wręcz", so matching
 * the sentence „walka wręcz ≥ 6" by name would count an unarmed-combat weapon
 * as satisfying an attribute requirement. Offering an entry on a loose match
 * only wastes budget; removing one on a loose match costs the model a choice it
 * should have had.
 */
function dropUnsupportedEntries(
  selected: readonly CharacterGenerationCatalogEntry[],
  requirementsById: ReadonlyMap<string, readonly Requirement[]>,
): CharacterGenerationCatalogEntry[]
{
  let surviving = [...selected];

  for (;;) {
    const bestGradeByName = new Map<string, number>();
    for (const entry of surviving) {
      const key = nameKey(entry.name);
      bestGradeByName.set(key, Math.max(bestGradeByName.get(key) ?? 0, entry.grade ?? 0));
    }

    const kept = surviving.filter(entry =>
      (requirementsById.get(entry.id) ?? []).every(requirement => isSatisfiable(requirement, bestGradeByName)));

    if (kept.length === surviving.length) return kept;
    surviving = kept;
  }
}

export function selectCatalogEntries(input: CatalogSelectionInput): CharacterGenerationCatalogEntry[]
{
  const queryTokens = tokenize(input.query);
  const demands = collectRequirementDemands(input.entries);
  const requiredNames = new Set(demands.keys());
  const satisfierIds = findDemandSatisfiers(input.entries);

  const pinnedIds = input.pinnedIds ?? new Set<string>();
  const pinned: ScoredEntry[] = [];

  const byKind = new Map<string, ScoredEntry[]>();
  for (const entry of input.entries) {
    const scored = {
      score: scoreCatalogEntry(entry, queryTokens),
      entry,
      satisfies: satisfierIds.has(entry.id),
    };
    if (pinnedIds.has(entry.id)) {
      pinned.push(scored);
      continue;
    }
    const bucket = byKind.get(entry.kind);
    if (bucket) bucket.push(scored);
    else byKind.set(entry.kind, [scored]);
  }

  const guaranteed: ScoredEntry[] = [];
  const optionalByKind = new Map<string, ScoredEntry[]>();

  for (const [kind, bucket] of byKind) {
    const quota = input.quotas[kind] ?? input.defaultQuota;
    bucket.sort(compareEntries);

    // Entries are versioned by rank under one name, so an unfiltered pick
    // returns „Postawa Miecznika" four times and calls it four options. Only
    // the lowest ranks travel: they establish that the entry exists and what it
    // demands, and a higher rank of the same name is the same choice again.
    const seenNames = new Map<string, number>();
    const distinct = bucket.filter(scored => {
      if (requiredNames.has(nameKey(scored.entry.name))) return true;

      const seen = seenNames.get(scored.entry.name) ?? 0;
      if (seen >= MAX_GRADES_PER_NAME) return false;

      seenNames.set(scored.entry.name, seen + 1);
      return true;
    });

    const eligible = distinct
      .filter((scored, index) => index < quota.min || scored.score > 0)
      .slice(0, quota.max);

    guaranteed.push(...eligible.slice(0, quota.min));
    optionalByKind.set(kind, eligible.slice(quota.min));
  }

  // Filling the remaining budget in pure score order lets one populous kind take
  // everything: nine hundred maneuvers outscored two hundred stances and the
  // model was left with four stances to choose from. Kinds take turns instead,
  // so breadth survives even when one of them matches the description best.
  const optional: ScoredEntry[] = [];
  const queues = [...optionalByKind.values()];
  for (let round = 0; queues.some(queue => round < queue.length); round++) {
    for (const queue of queues) {
      if (round < queue.length) optional.push(queue[round]);
    }
  }

  // A slice of the budget is held back for prerequisites. Offering „Garda"
  // while withholding the „Większy Fechtunek" it demands leaves the model with
  // no right answer: take the maneuver unsupported, or drop something the
  // description plainly calls for.
  const prerequisiteBudget = Math.floor(input.budgetChars * PREREQUISITE_BUDGET_SHARE);
  const selectionBudget = input.budgetChars - prerequisiteBudget;

  const selected: CharacterGenerationCatalogEntry[] = [];
  const selectedIds = new Set<string>();
  let usedChars = 0;

  const take = (scored: { entry: CharacterGenerationCatalogEntry }, budget: number): void => {
    if (selectedIds.has(scored.entry.id)) return;

    const cost = JSON.stringify(scored.entry).length;
    if (usedChars + cost > budget) return;

    usedChars += cost;
    selectedIds.add(scored.entry.id);
    selected.push(scored.entry);
  };

  // The guaranteed slice claims the budget first, so a kind the model must
  // always be able to choose from — races above all — cannot be crowded out by
  // a long tail of well-matching maneuvers.
  pinned.forEach(scored => take(scored, selectionBudget));
  guaranteed.forEach(scored => take(scored, selectionBudget));
  optional.forEach(scored => take(scored, selectionBudget));

  // Second pass: whatever the chosen entries demand by name is offered too, so
  // the model can satisfy a requirement instead of only reading about it. The
  // rank that answers a demand goes first here as well — the reserved slice is
  // small, and spending it on ranks nobody asked for wastes it entirely.
  const demanded = collectRequirementDemands(selected);

  input.entries
    .filter(entry => !selectedIds.has(entry.id) && demanded.has(nameKey(entry.name)))
    .map(entry => ({ score: 0, entry, satisfies: satisfierIds.has(entry.id) }))
    .sort(compareEntries)
    .forEach(scored => take(scored, input.budgetChars));

  // Last, because it can only judge what is actually on offer: an entry whose
  // prerequisite the two passes above failed to fit is not an option.
  return input.requirementsById
    ? dropUnsupportedEntries(selected, input.requirementsById)
    : selected;
}
