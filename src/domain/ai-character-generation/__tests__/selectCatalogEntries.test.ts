import { describe, expect, it } from 'vitest';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import type { Requirement } from '@/domain/requirements/Requirement';
import { selectCatalogEntries, scoreCatalogEntry, tokenize } from '@/domain/ai-character-generation/selectCatalogEntries';

const ARNOLD = 'Wojak Arnold służący baronowi Ertranowi. Jest to wyróżniający się wojownik, '
  + 'którego atutem jest talent w fortelu, zwłaszcza dobrze radzi sobie w fintowaniu. '
  + 'Walczy mieczem i tarczą.';

function maneuver(name: string, grade = 1, requirements?: string[]): CharacterGenerationCatalogEntry
{
  return { kind: 'maneuver', id: `maneuver-${name}-${grade}`, name, grade, price: grade * 10, requirements };
}

const generous = { min: 0, max: 100 };

/** A floor, so an entry that shares no word with the description still travels. */
const floored = { min: 5, max: 100 };

/**
 * Structured requirements keyed by entry identifier.
 *
 * Typed rather than inferred with `as const`: a const assertion makes
 * `anyOf.options` a readonly tuple, which does not satisfy `AnyOfRequirement`,
 * and the fixture stops describing the shape the production code receives.
 */
const requirementIndex = (...entries: [string, Requirement[]][]) => new Map(entries);

describe('selectCatalogEntries', () => {
  it('matches an inflected description against the catalog name', () => {
    // „fintowaniu" and „Finta" share no whole word, only a stem.
    expect(scoreCatalogEntry(maneuver('Finta'), tokenize(ARNOLD))).toBeGreaterThan(0);
    expect(scoreCatalogEntry(maneuver('Szarża konna'), tokenize(ARNOLD))).toBe(0);
  });

  it('offers the maneuver the description alludes to', () => {
    const selected = selectCatalogEntries({
      entries: [maneuver('Szarża konna'), maneuver('Finta'), maneuver('Zasłona')],
      query: ARNOLD,
      quotas: { maneuver: { min: 0, max: 1 } },
      defaultQuota: generous,
      budgetChars: 10_000,
    });

    expect(selected.map(entry => entry.name)).toEqual(['Finta']);
  });

  it('offers the lowest ranks and stops repeating one entry', () => {
    const selected = selectCatalogEntries({
      entries: [maneuver('Finta', 3), maneuver('Finta', 1), maneuver('Finta', 2)],
      query: ARNOLD,
      quotas: { maneuver: generous },
      defaultQuota: generous,
      budgetChars: 10_000,
    });

    // Higher ranks of one name are the same choice again, and space spent on
    // them is space not spent on a different entry.
    expect(selected.map(entry => entry.grade)).toEqual([1, 2]);
  });

  it('gives every kind a turn instead of letting the biggest one take the budget', () => {
    const manyManeuvers = Array.from({ length: 40 }, (_, index) => maneuver(`Finta ${index}`, 1));
    const stances = Array.from({ length: 10 }, (_, index) => ({
      kind: 'stance',
      id: `stance-${index}`,
      name: `Postawa Fortelu ${index}`,
      grade: 1,
    }));

    const selected = selectCatalogEntries({
      entries: [...manyManeuvers, ...stances],
      query: ARNOLD,
      quotas: { maneuver: { min: 0, max: 100 }, stance: { min: 0, max: 100 } },
      defaultQuota: generous,
      budgetChars: 1_200,
    });

    expect(selected.filter(entry => entry.kind === 'stance').length).toBeGreaterThan(0);
    expect(selected.filter(entry => entry.kind === 'maneuver').length).toBeGreaterThan(0);
  });

  it('carries the requirements so the model can meet them', () => {
    const selected = selectCatalogEntries({
      entries: [maneuver('Finta', 1, ['fortel ≥ 5'])],
      query: ARNOLD,
      quotas: { maneuver: generous },
      defaultQuota: generous,
      budgetChars: 10_000,
    });

    expect(selected[0].requirements).toEqual(['fortel ≥ 5']);
  });

  it('always offers a kind with a floor, even when nothing matches', () => {
    const selected = selectCatalogEntries({
      entries: [
        { kind: 'race', id: 'race-1', name: 'Człowiek' },
        { kind: 'race', id: 'race-2', name: 'Krasnolud' },
        maneuver('Szarża konna'),
      ],
      query: ARNOLD,
      quotas: { race: { min: 2, max: 2 }, maneuver: { min: 0, max: 10 } },
      defaultQuota: generous,
      budgetChars: 10_000,
    });

    expect(selected.filter(entry => entry.kind === 'race')).toHaveLength(2);
    expect(selected.filter(entry => entry.kind === 'maneuver')).toHaveLength(0);
  });

  it('lets the guaranteed entries claim a tight budget before the matches', () => {
    const selected = selectCatalogEntries({
      entries: [
        { kind: 'race', id: 'race-1', name: 'Człowiek' },
        maneuver('Finta'),
      ],
      query: ARNOLD,
      quotas: { race: { min: 1, max: 1 }, maneuver: { min: 0, max: 10 } },
      defaultQuota: generous,
      budgetChars: 60,
    });

    expect(selected.map(entry => entry.kind)).toEqual(['race']);
  });

  it('offers what the reference characters hold, whatever it scores', () => {
    const stance = { kind: 'stance', id: 'stance-defensywna', name: 'Postawa Defensywna', grade: 2 };

    const selected = selectCatalogEntries({
      entries: [stance, maneuver('Finta')],
      // Nothing in Arnold's description resembles „Postawa Defensywna", which is
      // why relevance alone dropped it and the model could not follow its own
      // reference characters.
      query: ARNOLD,
      quotas: { stance: { min: 0, max: 100 }, maneuver: generous },
      defaultQuota: generous,
      budgetChars: 10_000,
      pinnedIds: new Set(['stance-defensywna']),
    });

    expect(selected.map(entry => entry.name)).toContain('Postawa Defensywna');
  });

  it('keeps every rank of an entry other entries demand by rank', () => {
    const entries = [
      maneuver('Finta', 1, ['Większy Fortel ≥ 6']),
      ...Array.from({ length: 6 }, (_, index) => ({
        kind: 'perk',
        id: `fortel-${index + 1}`,
        name: 'Większy Fortel',
        grade: index + 1,
      })),
    ];

    const selected = selectCatalogEntries({
      entries,
      query: ARNOLD,
      quotas: { maneuver: generous, perk: generous },
      defaultQuota: generous,
      budgetChars: 10_000,
    });

    // A requirement naming rank 6 is unusable when only ranks 1 and 2 travel.
    // Rank 6 leads because it is the one that answers the demand; the rest
    // follow in the usual cheapest-first order.
    const grades = selected.filter(entry => entry.name === 'Większy Fortel').map(entry => entry.grade);

    expect(grades[0]).toBe(6);
    expect([...grades].sort((left, right) => (left ?? 0) - (right ?? 0))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('offers the entry a chosen entry demands, however badly it scores', () => {
    // „Większy Fechtunek" shares no word with a description about feints, so
    // relevance dropped it — while „Garda", which demands it, was offered. The
    // model then had no way to satisfy a requirement it could plainly read.
    const selected = selectCatalogEntries({
      entries: [
        maneuver('Garda', 2, ['Większy Fechtunek ≥ 3']),
        { kind: 'perk', id: 'wf-3', name: 'Większy Fechtunek', grade: 3 },
        { kind: 'perk', id: 'inny', name: 'Kowalstwo Podkowiarskie', grade: 1 },
      ],
      query: ARNOLD,
      // Garda scores nothing against this description; the floor is what puts
      // it in front of the model, and its requirement has to follow it in.
      quotas: { maneuver: { min: 1, max: 100 }, perk: { min: 0, max: 100 } },
      defaultQuota: { min: 0, max: 100 },
      budgetChars: 10_000,
    });

    const names = selected.map(entry => entry.name);
    expect(names).toContain('Większy Fechtunek');
    expect(names).not.toContain('Kowalstwo Podkowiarskie');
  });

  it('offers the rank that satisfies a demand before the ranks below it', () => {
    // A draft came back holding „Większy Fortel" at 5 against a requirement for
    // 6: the prerequisite pass filled up from rank 1 and ran out of budget one
    // rank short of the only one that would have done any good.
    const ranks = Array.from({ length: 8 }, (_, index) => ({
      kind: 'perk', id: `wf-${index + 1}`, name: 'Większy Fortel', grade: index + 1,
      description: 'x'.repeat(200),
    } satisfies CharacterGenerationCatalogEntry));

    const selected = selectCatalogEntries({
      entries: [maneuver('Finta', 1, ['Większy Fortel ≥ 6']), ...ranks],
      query: ARNOLD,
      // No room for eight ranks; the pass has to spend what it has on rank 6.
      quotas: { maneuver: generous, perk: { min: 0, max: 100 } },
      defaultQuota: generous,
      budgetChars: 900,
    });

    expect(selected.filter(entry => entry.name === 'Większy Fortel').map(entry => entry.grade))
      .toContain(6);
  });

  it('reads both sides of an either-or requirement', () => {
    // „Większy Fechtunek ≥ 5 lub Większy Fortel ≥ 5" — only the first name was
    // parsed, so the alternative could never be offered and never chosen.
    const selected = selectCatalogEntries({
      entries: [
        maneuver('Atak Rękojeścią', 2, ['Większy Fechtunek ≥ 5 lub Większy Fortel ≥ 5']),
        { kind: 'perk', id: 'wfe-5', name: 'Większy Fechtunek', grade: 5 },
        { kind: 'perk', id: 'wfo-5', name: 'Większy Fortel', grade: 5 },
      ],
      query: ARNOLD,
      quotas: { maneuver: { min: 1, max: 100 }, perk: { min: 0, max: 100 } },
      defaultQuota: { min: 0, max: 100 },
      budgetChars: 10_000,
    });

    expect(selected.map(entry => entry.name)).toContain('Większy Fortel');
    expect(selected.map(entry => entry.name)).toContain('Większy Fechtunek');
  });

  it('leaves out an entry whose prerequisite is not on offer', () => {
    // „Wir Ostrzy" demands two maneuvers that did not fit; shown without them it
    // is not an option, only a way to produce an unmet requirement.
    const wir = maneuver('Wir Ostrzy', 1);
    const requirementsById = requirementIndex(
      [wir.id, [{ kind: 'ranked', group: 'maneuvers', targetKey: 'Taniec Ostrzy', value: 1 }]],
    );

    const selected = selectCatalogEntries({
      entries: [wir, maneuver('Finta', 1)],
      query: ARNOLD,
      quotas: { maneuver: floored },
      defaultQuota: generous,
      budgetChars: 10_000,
      requirementsById,
    });

    expect(selected.map(entry => entry.name)).toEqual(['Finta']);
  });

  it('keeps an entry once its prerequisite is on offer', () => {
    const wir = maneuver('Wir Ostrzy', 1);
    const taniec = maneuver('Taniec Ostrzy', 2);
    const requirementsById = requirementIndex(
      [wir.id, [{ kind: 'ranked', group: 'maneuvers', targetKey: 'Taniec Ostrzy', value: 1 }]],
    );

    const selected = selectCatalogEntries({
      entries: [wir, taniec],
      query: ARNOLD,
      quotas: { maneuver: floored },
      defaultQuota: generous,
      budgetChars: 10_000,
      requirementsById,
    });

    expect(selected.map(entry => entry.name).sort()).toEqual(['Taniec Ostrzy', 'Wir Ostrzy']);
  });

  it('takes out whatever depended on what it just took out', () => {
    // „Wyrok Dualisty" needs „Wir Ostrzy", which is itself unsupported; removing
    // one at a time and stopping would leave the second trap in place.
    const wir = maneuver('Wir Ostrzy', 1);
    const wyrok = maneuver('Wyrok Dualisty', 1);
    const requirementsById = requirementIndex(
      [wir.id, [{ kind: 'ranked', group: 'maneuvers', targetKey: 'Taniec Ostrzy', value: 1 }]],
      [wyrok.id, [{ kind: 'ranked', group: 'maneuvers', targetKey: 'Wir Ostrzy', value: 1 }]],
    );

    const selected = selectCatalogEntries({
      entries: [wir, wyrok, maneuver('Finta', 1)],
      query: ARNOLD,
      quotas: { maneuver: floored },
      defaultQuota: generous,
      budgetChars: 10_000,
      requirementsById,
    });

    expect(selected.map(entry => entry.name)).toEqual(['Finta']);
  });

  it('does not read a statistic requirement as a missing compendium entry', () => {
    // The compendium holds a weapon called „Walka Wręcz", so matching the
    // sentence „walka wręcz ≥ 6" by name would drop entries that are perfectly
    // takeable — the character just has to raise the attribute.
    const technika = maneuver('Zwodnicza Technika', 1);
    const requirementsById = requirementIndex(
      [technika.id, [{ kind: 'ranked', group: 'attributes', targetKey: 'martialArt', value: 6 }]],
    );

    const selected = selectCatalogEntries({
      entries: [technika],
      query: ARNOLD,
      quotas: { maneuver: floored },
      defaultQuota: generous,
      budgetChars: 10_000,
      requirementsById,
    });

    expect(selected.map(entry => entry.name)).toEqual(['Zwodnicza Technika']);
  });

  it('keeps an alternative requirement as long as one side is on offer', () => {
    const atak = maneuver('Atak Rękojeścią', 2);
    const requirementsById = requirementIndex(
      [atak.id, [{
        kind: 'anyOf',
        options: [
          { kind: 'ranked', group: 'perks', targetKey: 'Większy Fechtunek', value: 5 },
          { kind: 'ranked', group: 'perks', targetKey: 'Większy Fortel', value: 5 },
        ],
      }]],
    );

    const selected = selectCatalogEntries({
      entries: [atak, { kind: 'perk', id: 'wfo-5', name: 'Większy Fortel', grade: 5 }],
      query: ARNOLD,
      quotas: { maneuver: floored, perk: floored },
      defaultQuota: generous,
      budgetChars: 10_000,
      requirementsById,
    });

    expect(selected.map(entry => entry.name)).toContain('Atak Rękojeścią');
  });

  it('never offers the same entry twice', () => {
    const selected = selectCatalogEntries({
      entries: [maneuver('Finta', 1, ['Większy Fortel ≥ 4']), { kind: 'perk', id: 'wf', name: 'Większy Fortel', grade: 4 }],
      query: ARNOLD,
      quotas: { maneuver: generous, perk: generous },
      defaultQuota: generous,
      budgetChars: 10_000,
      pinnedIds: new Set(['wf']),
    });

    expect(new Set(selected.map(entry => entry.id)).size).toBe(selected.length);
  });

  it('stays inside the character budget', () => {
    const entries = Array.from({ length: 200 }, (_, index) => maneuver(`Finta ${index}`, 1));

    const selected = selectCatalogEntries({
      entries,
      query: ARNOLD,
      quotas: { maneuver: { min: 0, max: 200 } },
      defaultQuota: generous,
      budgetChars: 1_000,
    });

    expect(selected.length).toBeGreaterThan(0);
    expect(JSON.stringify(selected).length).toBeLessThanOrEqual(1_200);
  });
});
