import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import type { AiCharacterGenerationReference } from '@/domain/ai-character-generation/CharacterGenerationContextSource';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';

export type AiCharacterGenerationAllowedReferences = {
  raceIds: Set<string>;
  stanceIds: Set<string>;
  stateIds: Set<string>;
  maneuverIds: Set<string>;
  spellIds: Set<string>;
  powerSpecificationIds: Set<string>;
};

/** Catalog kinds that answer to one of the allowed-reference sets. */
const CATALOG_KIND_TO_SET: Record<string, keyof AiCharacterGenerationAllowedReferences> = {
  race: 'raceIds',
  stance: 'stanceIds',
  state: 'stateIds',
  maneuver: 'maneuverIds',
  spell: 'spellIds',
  powerSpecification: 'powerSpecificationIds',
};

/**
 * The compendium is the primary source of global identifiers; reference
 * characters only add whatever they happen to carry. Before the catalog existed
 * the reverse was true, and validating against references alone rejected every
 * legitimate catalog pick — a draft with no reference characters had an empty
 * allowed set and could not name a single race or maneuver.
 */
export function getAiCharacterGenerationAllowedReferences(
  references: AiCharacterGenerationReference[],
  catalogEntries: readonly CharacterGenerationCatalogEntry[] = [],
): AiCharacterGenerationAllowedReferences
{
  const allowed: AiCharacterGenerationAllowedReferences = {
    raceIds: new Set(references.flatMap(reference => reference.race ? [reference.race.id] : [])),
    stanceIds: new Set(references.flatMap(reference => reference.stances.map(stance => stance.id))),
    stateIds: new Set(references.flatMap(reference => reference.states.map(state => state.id))),
    maneuverIds: new Set(references.flatMap(reference => reference.maneuvers.map(maneuver => maneuver.id))),
    spellIds: new Set(references.flatMap(reference => reference.powers.flatMap(power => power.spells.map(spell => spell.id)))),
    powerSpecificationIds: new Set(references.flatMap(reference => reference.powers.map(power => power.powerSpecificationId))),
  };

  for (const entry of catalogEntries) {
    const set = CATALOG_KIND_TO_SET[entry.kind];
    if (set) allowed[set].add(entry.id);
  }

  return allowed;
}

const duplicateIds = (ids: string[]) => [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

function pushUnavailableReferenceIssues(
  issues: string[],
  ids: string[],
  allowedIds: Set<string>,
  label: string,
  requireCatalogMembership = true,
): void
{
  // A request that permitted authoring expects entries the compendium does not
  // have yet; the acceptance transaction creates those instead of linking them.
  // Duplicates stay an error either way — one character cannot hold the same
  // entry twice regardless of where it came from.
  if (requireCatalogMembership && ids.some(id => !allowedIds.has(id))) {
    issues.push(`${label} musi pochodzić z kompendium lub z przekazanych postaci referencyjnych.`);
  }

  if (duplicateIds(ids).length > 0) {
    issues.push(`${label} nie może występować więcej niż raz.`);
  }
}

function pushActiveProfileIssues(
  issues: string[],
  profileIds: string[],
  activeIds: string[],
  label: string,
): void
{
  if (activeIds.some(id => !profileIds.includes(id))) {
    issues.push(`Aktywny profil ${label} musi należeć do propozycji tej postaci.`);
  }
}

/**
 * Validates rules that cannot be represented by the DTO schema alone. In
 * particular, a model may only use global compendium IDs supplied by the BFF
 * in its selected references; it cannot invent or publish a global record.
 */
export type AiCharacterProposalValidationOptions = {
  /** The request let the model author abilities outside the compendium. */
  allowCustomAbilities?: boolean;
};

export function validateAiCharacterProposalForAcceptance(
  proposal: AiCharacterProposal,
  allowed: AiCharacterGenerationAllowedReferences,
  options: AiCharacterProposalValidationOptions = {},
): string[]
{
  const issues: string[] = [];
  const { combat, buffs } = proposal;
  const requireCatalogAbilities = !options.allowCustomAbilities;

  if (combat.defaultDefenseId && !combat.defenses.some(defense => defense.id === combat.defaultDefenseId)) {
    issues.push('Domyślna obrona musi wskazywać jedną z proponowanych obron.');
  }
  if (combat.defaultOffenseId && !combat.offenses.some(offense => offense.id === combat.defaultOffenseId)) {
    issues.push('Domyślna ofensywa musi wskazywać jedną z proponowanych ofensyw.');
  }

  if (proposal.header.raceId && !allowed.raceIds.has(proposal.header.raceId)) {
    issues.push('Rasa musi pochodzić z kompendium lub z przekazanych postaci referencyjnych.');
  }

  pushUnavailableReferenceIssues(issues, combat.stances.map(stance => stance.id), allowed.stanceIds, 'Postawa', requireCatalogAbilities);
  pushUnavailableReferenceIssues(issues, combat.states.map(state => state.id), allowed.stateIds, 'Stan', requireCatalogAbilities);
  pushUnavailableReferenceIssues(issues, combat.maneuvers.map(maneuver => maneuver.id), allowed.maneuverIds, 'Manewr', requireCatalogAbilities);
  pushUnavailableReferenceIssues(
    issues,
    combat.powers.flatMap(power => power.spells.map(spell => spell.id)),
    allowed.spellIds,
    'Zaklęcie',
  );
  pushUnavailableReferenceIssues(
    issues,
    combat.powers.map(power => power.powerSpecificationId),
    allowed.powerSpecificationIds,
    'Specyfikacja mocy',
  );

  pushActiveProfileIssues(issues, buffs.buffProfiles.map(profile => profile.id), buffs.activeBuffProfileIds, 'wzmocnień');
  pushActiveProfileIssues(issues, buffs.stanceModifierProfiles.map(profile => profile.id), buffs.activeStanceModifierProfileIds, 'postaw');
  pushActiveProfileIssues(issues, buffs.stateModifierProfiles.map(profile => profile.id), buffs.activeStateModifierProfileIds, 'stanów');
  pushActiveProfileIssues(issues, buffs.otherModifierProfiles.map(profile => profile.id), buffs.activeOtherModifierProfileIds, 'pozostałych modyfikatorów');

  const validLinkedEntityIds = new Set([
    ...combat.stances.map(stance => stance.id),
    ...combat.states.map(state => state.id),
  ]);
  const allProfiles = [
    ...buffs.buffProfiles,
    ...buffs.stanceModifierProfiles,
    ...buffs.stateModifierProfiles,
    ...buffs.otherModifierProfiles,
  ];
  if (allProfiles.some(profile => profile.linkedEntityId && !validLinkedEntityIds.has(profile.linkedEntityId))) {
    issues.push('Profil wzmocnień może wskazywać wyłącznie postawę lub stan z tej propozycji.');
  }

  return issues;
}
