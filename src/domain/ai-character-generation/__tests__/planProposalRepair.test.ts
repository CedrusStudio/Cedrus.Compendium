import { describe, expect, it } from 'vitest';
import {
  decideProposalRepair,
  isRepairableIssue,
  keepBetterAttempt,
  selectRepairableIssues,
} from '@/domain/ai-character-generation/planProposalRepair';

const UNMET = 'Manewr „Garda (2)" ma niespełnione wymagania: Większy Fechtunek ≥ 3.';
const OUTSIDE = 'Postawa musi pochodzić z kompendium lub z przekazanych postaci referencyjnych.';
const CONVENTION = 'Zestaw ataku „Miecz i tarcza" ma pulę jednej kości (1k10+2). W kompendium tak walczy 4% postaci.';

/** A first call that cost 85 000 µUSD against a 200 000 reservation. */
const budget = { spentMicroUsd: 85_000, reservedMicroUsd: 200_000 };

describe('isRepairableIssue', () => {
  it('treats a broken rule as worth a second call', () => {
    expect(isRepairableIssue(UNMET)).toBe(true);
    expect(isRepairableIssue(OUTSIDE)).toBe(true);
  });

  it('leaves a convention alone', () => {
    // „unusual, not wrong" — asking a model to iron out every unusual number
    // would flatten exactly the characters worth generating.
    expect(isRepairableIssue(CONVENTION)).toBe(false);
  });
});

describe('decideProposalRepair', () => {
  it('does not spend a second call on a clean draft', () => {
    expect(decideProposalRepair({ issues: [], budget }))
      .toEqual({ attempt: false, reason: 'nothing-to-fix' });
  });

  it('does not spend a second call on notes nobody can act on', () => {
    expect(decideProposalRepair({ issues: [CONVENTION], budget }))
      .toEqual({ attempt: false, reason: 'not-repairable' });
  });

  it('carries only the actionable notes into the repair', () => {
    const decision = decideProposalRepair({ issues: [CONVENTION, UNMET, OUTSIDE], budget });

    expect(decision).toMatchObject({ attempt: true });
    expect(decision.attempt && decision.issues).toEqual([UNMET, OUTSIDE]);
  });

  it('refuses when a second call would overrun what the request was admitted on', () => {
    // The reservation is the ceiling for the whole request, not per call.
    expect(decideProposalRepair({
      issues: [UNMET],
      budget: { spentMicroUsd: 120_000, reservedMicroUsd: 200_000 },
    })).toEqual({ attempt: false, reason: 'no-budget' });
  });

  it('allows a repair that fits exactly', () => {
    expect(decideProposalRepair({
      issues: [UNMET],
      budget: { spentMicroUsd: 100_000, reservedMicroUsd: 200_000 },
    })).toMatchObject({ attempt: true });
  });
});

describe('keepBetterAttempt', () => {
  const first = { proposal: 'pierwszy', issues: [UNMET, OUTSIDE] };

  it('keeps the repair that actually fixed something', () => {
    const repaired = { proposal: 'poprawiony', issues: [OUTSIDE] };

    expect(keepBetterAttempt(first, repaired))
      .toEqual({ chosen: repaired, improved: true });
  });

  it('keeps the first draft when the repair traded one fault for another', () => {
    // A second answer is a fresh draft that happens to have seen its
    // predecessor's faults; it is not automatically an improvement.
    const repaired = { proposal: 'poprawiony', issues: [UNMET, OUTSIDE] };

    expect(keepBetterAttempt(first, repaired))
      .toEqual({ chosen: first, improved: false });
  });

  it('keeps the first draft when the repair made things worse', () => {
    const repaired = { proposal: 'poprawiony', issues: [UNMET, OUTSIDE, UNMET] };

    expect(keepBetterAttempt(first, repaired).chosen).toBe(first);
  });

  it('judges the repair only on what it was asked to fix', () => {
    // The repair was never asked to change a convention, so a new balance note
    // must not count against it.
    const repaired = { proposal: 'poprawiony', issues: [CONVENTION] };

    expect(keepBetterAttempt(first, repaired)).toEqual({ chosen: repaired, improved: true });
  });
});

describe('selectRepairableIssues', () => {
  it('keeps the order the review produced', () => {
    expect(selectRepairableIssues([OUTSIDE, CONVENTION, UNMET])).toEqual([OUTSIDE, UNMET]);
  });
});
