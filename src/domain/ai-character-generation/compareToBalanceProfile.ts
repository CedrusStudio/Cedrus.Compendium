import type { BalanceProfile } from '@/domain/ai-character-generation/buildBalanceProfiles';
import type { PowerTier } from '@/domain/ai-character-generation/powerTiers';
import { SKILLS } from '@/domain/characters/statistics/skills';

/**
 * Where one number sits against what the compendium usually holds.
 *
 * `band` is the whole point: „8" means nothing on its own, and „8 przy medianie
 * 3 i p90 7" is a judgement anyone can check.
 */
export type BalanceBand = 'poniżej mediany' | 'w normie' | 'wysoko' | 'powyżej maksimum';

export type BalanceDeviation = {
  name: string;
  value: number;
  median: number;
  high: number;
  max: number;
  band: BalanceBand;
};

export type BalanceComparison = {
  tag: string;
  characters: number;
  attributes: BalanceDeviation[];
  /** Highest attribute the character reaches — its speciality. */
  speciality: BalanceDeviation;
  maneuvers: { value: number; median: number; high: number; band: BalanceBand };
  perks: { value: number; median: number; high: number; band: BalanceBand };
};

/** The shape this reads: a proposal, a stored character, anything with numbers. */
export type BalanceSubject = {
  attributes?: Record<string, { value?: number } | undefined>;
  maneuverCount: number;
  perkCount: number;
};

function toBand(value: number, median: number, high: number, max: number): BalanceBand
{
  if (value > max) return 'powyżej maksimum';
  if (value > high) return 'wysoko';
  if (value < median) return 'poniżej mediany';
  return 'w normie';
}

/**
 * Compares a character against the profile of its kind.
 *
 * Reporting only: a character outside the band is not wrong, it is unusual, and
 * telling the two apart is the reviewer's job. The same reasoning as
 * `checkRequirement` — the application does not overrule a deliberate call.
 */
export function compareToBalanceProfile(subject: BalanceSubject, profile: BalanceProfile): BalanceComparison
{
  const attributeKeys = SKILLS.filter(([group]) => group === 'attributes');

  const attributes = attributeKeys.map(([, key, polish]) => {
    const value = subject.attributes?.[key]?.value ?? 0;
    const statistic = profile.attributes.find(entry => entry.name === polish);
    const median = statistic?.median ?? 0;
    const high = statistic?.high ?? 0;
    const max = statistic?.max ?? 0;

    return { name: polish, value, median, high, max, band: toBand(value, median, high, max) };
  });

  const specialityValue = Math.max(0, ...attributes.map(attribute => attribute.value));
  const specialityName = attributes.find(attribute => attribute.value === specialityValue)?.name ?? '—';

  return {
    tag: profile.tag,
    characters: profile.characters,
    attributes,
    speciality: {
      name: specialityName,
      value: specialityValue,
      median: profile.speciality.median,
      high: profile.speciality.high,
      max: profile.speciality.max,
      band: toBand(specialityValue, profile.speciality.median, profile.speciality.high, profile.speciality.max),
    },
    maneuvers: {
      value: subject.maneuverCount,
      median: profile.maneuvers.median,
      high: profile.maneuvers.high,
      band: toBand(subject.maneuverCount, profile.maneuvers.median, profile.maneuvers.high, Number.POSITIVE_INFINITY),
    },
    perks: {
      value: subject.perkCount,
      median: profile.perks.median,
      high: profile.perks.high,
      band: toBand(subject.perkCount, profile.perks.median, profile.perks.high, Number.POSITIVE_INFINITY),
    },
  };
}

export type TierDrift = {
  tier: string;
  field: 'speciality' | 'maneuvers';
  intended: number;
  measuredMedian: number;
  measuredHigh: number;
  note: string;
};

/**
 * Where the curated tiers and the measured compendium disagree.
 *
 * Both are legitimate — the table is intent, the profile is convention — but a
 * silent divergence means the model is being told two different things. This
 * surfaces it so the answer is a decision: update the table, or finish the
 * characters that drag the median down.
 */
export function findTierDrift(tiers: readonly PowerTier[], profile: BalanceProfile): TierDrift[]
{
  const drift: TierDrift[] = [];

  for (const tier of tiers) {
    // A scale whose family does not use maneuvers at all says nothing useful
    // about a profile that does, and the other way round.
    if (tier.maneuvers === 0 && profile.maneuvers.high > 0) continue;

    if (tier.speciality > profile.speciality.max) {
      drift.push({
        tier: tier.name,
        field: 'speciality',
        intended: tier.speciality,
        measuredMedian: profile.speciality.median,
        measuredHigh: profile.speciality.high,
        note: 'Poziom celuje wyżej, niż sięga którakolwiek istniejąca postać tego rodzaju.',
      });
    }

    if (tier.maneuvers > profile.maneuvers.high * 2) {
      drift.push({
        tier: tier.name,
        field: 'maneuvers',
        intended: tier.maneuvers,
        measuredMedian: profile.maneuvers.median,
        measuredHigh: profile.maneuvers.high,
        note: 'Poziom żąda dwukrotnie więcej manewrów niż p90 tego rodzaju.',
      });
    }
  }

  return drift;
}
