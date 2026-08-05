/**
 * Whether to ask the model to fix its own draft, and which answer to keep.
 *
 * The review notes are computed on the server after every generation anyway, so
 * the information needed to repair a draft already exists — it was simply never
 * given back to the model. A hand-written draft prepared with the same context
 * and the same rules came back with zero notes; the hosted ones came back with
 * one to seven. The difference was not the context. It was that the offline
 * route could check its own work before submitting and the hosted one could not.
 *
 * This is deliberately a domain decision rather than a provider detail: whether
 * a second paid call is worth making depends on the budget and on whether the
 * notes are the kind a model can act on, neither of which belongs in an adapter.
 */

export type ProposalRepairBudget = {
  /** What the first call actually cost. */
  spentMicroUsd: number;
  /** The ceiling this whole request was reserved against. */
  reservedMicroUsd: number;
};

/**
 * A repair costs about what the first call cost — same context, same schema,
 * one extra proposal in the input. Assuming parity is the safe estimate; being
 * wrong by a little means skipping a repair that would have fitted, which is a
 * cheaper mistake than overrunning the reservation the request was admitted on.
 */
export const estimateRepairCostMicroUsd = (spentMicroUsd: number) => spentMicroUsd;

/**
 * Notes that describe a deliberate choice rather than a mistake.
 *
 * The balance and combat reviews are conventions — „unusual, not wrong" — and
 * asking a model to iron out every unusual number would flatten exactly the
 * characters worth generating. Only the notes that name a broken rule are worth
 * a second call.
 */
const REPAIRABLE_MARKERS = [
  'niespełnione wymagania',
  'musi pochodzić z kompendium',
  'nie może występować więcej niż raz',
  'musi wskazywać',
  'musi należeć',
];

export const isRepairableIssue = (issue: string) =>
  REPAIRABLE_MARKERS.some(marker => issue.includes(marker));

export function selectRepairableIssues(issues: readonly string[]): string[]
{
  return issues.filter(isRepairableIssue);
}

export type RepairDecision =
  | { attempt: true; issues: string[] }
  | { attempt: false; reason: 'nothing-to-fix' | 'not-repairable' | 'no-budget' };

export function decideProposalRepair(input: {
  issues: readonly string[];
  budget: ProposalRepairBudget;
}): RepairDecision
{
  if (input.issues.length === 0) return { attempt: false, reason: 'nothing-to-fix' };

  const repairable = selectRepairableIssues(input.issues);
  if (repairable.length === 0) return { attempt: false, reason: 'not-repairable' };

  const wouldSpend = input.budget.spentMicroUsd + estimateRepairCostMicroUsd(input.budget.spentMicroUsd);
  if (wouldSpend > input.budget.reservedMicroUsd) return { attempt: false, reason: 'no-budget' };

  return { attempt: true, issues: repairable };
}

export type ProposalAttempt<TProposal> = {
  proposal: TProposal;
  issues: string[];
};

/**
 * Keeps the better of the two attempts, and the first one on a tie.
 *
 * A second answer is not automatically an improvement — it is a fresh draft
 * that happens to have been shown its predecessor's faults, and it can trade
 * them for different ones. Counting only the repairable notes is what makes the
 * comparison fair: the repair was never asked to change anything else, so
 * holding it responsible for a balance note would be measuring the wrong thing.
 */
export function keepBetterAttempt<TProposal>(
  first: ProposalAttempt<TProposal>,
  repaired: ProposalAttempt<TProposal>,
): { chosen: ProposalAttempt<TProposal>; improved: boolean }
{
  const before = selectRepairableIssues(first.issues).length;
  const after = selectRepairableIssues(repaired.issues).length;

  return after < before
    ? { chosen: repaired, improved: true }
    : { chosen: first, improved: false };
}
