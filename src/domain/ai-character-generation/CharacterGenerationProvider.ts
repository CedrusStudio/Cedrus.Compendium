import type {
  AiCharacterGenerationRequest,
  AiCharacterGenerationUsage,
} from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import type { AiCharacterGenerationReference } from '@/domain/ai-character-generation/CharacterGenerationContextSource';
import type { BalanceProfile } from '@/domain/ai-character-generation/buildBalanceProfiles';
import type { PowerScale, PowerTier } from '@/domain/ai-character-generation/powerTiers';

/**
 * One compendium record offered to the model. The requirements are rendered as
 * text because the model has to be able to reason about them — a character who
 * should know „Finta" needs the attribute the maneuver demands, at the value it
 * demands, and that is invisible if only names travel.
 */
export type CharacterGenerationCatalogEntry = {
  kind: string;
  id: string;
  name: string;
  description?: string;
  grade?: number;
  price?: number;
  tags?: string[];
  requirements?: string[];
  /**
   * Names this entry supersedes (ROADMAP 8.6). Without it a model cannot tell
   * that „Girgeńska Finta" is a variant standing in for „Finta" and will treat
   * the two as unrelated options.
   */
  replaces?: string[];
  /**
   * The record's own combat numbers, verbatim from the compendium: a weapon's
   * dice pool and critical, an armour's protection, a shield's block. Without
   * them the model has to invent an attack pool for a sword whose statistics it
   * was never shown, and it invents low.
   */
  statistics?: Record<string, unknown>;
};

export type CharacterGenerationCatalogContext = {
  availability: 'not-configured' | 'configured';
  entries: CharacterGenerationCatalogEntry[];
};

export type CharacterGenerationRulebookContext = {
  availability: 'not-configured' | 'configured';
  fragments: string[];
};

export type CharacterGenerationContext = {
  request: AiCharacterGenerationRequest;
  references: AiCharacterGenerationReference[];
  allowedCatalog: CharacterGenerationCatalogContext;
  rulebookContext: CharacterGenerationRulebookContext;
  /**
   * What characters of this kind actually look like, measured from the
   * compendium. Without it the model knows a speciality should beat ordinary
   * training but not that „exceptional" means 8 rather than 3.
   */
  balanceProfiles: BalanceProfile[];
  /**
   * Curated target for this character's power level, when the description names
   * one. Absent means the description did not say, and the measured profiles
   * are the only guide — better than inventing a tier the text never asked for.
   */
  powerTier?: PowerTier;
  /**
   * The ladder this kind of character is measured on. Warriors, mages, undead
   * and beasts are not built the same way — a mage carries thirty spells and no
   * maneuvers — so one table described three of the four wrongly.
   */
  powerScale: PowerScale;
};

export type CharacterGenerationProviderResult = {
  proposal: AiCharacterProposal;
  usage: AiCharacterGenerationUsage;
  providerRequestId?: string;
  costMicroUsd: number;
};

/**
 * A draft handed back to the model with the rules it broke.
 *
 * The issues are the server's own review notes, already computed after every
 * generation — the model simply never saw them. Only the ones naming a broken
 * rule travel; a note about an unusual number is a convention, not a fault.
 */
export type CharacterGenerationRepairRequest = {
  proposal: AiCharacterProposal;
  issues: readonly string[];
};

/**
 * Providers are data-only adapters. They cannot persist a character, access
 * an HTTP request, or choose a budget. The BFF owns those responsibilities,
 * which lets OpenAI and a later local Ollama adapter share one safety boundary.
 */
export interface CharacterGenerationProvider {
  readonly name: string;
  readonly model: string;

  generate(context: CharacterGenerationContext): Promise<CharacterGenerationProviderResult>;

  /**
   * Optional second pass: the same request, plus the draft that came back and
   * what is wrong with it. Optional because not every provider can do it — the
   * offline one runs no model at all, and there is nothing to ask.
   */
  repair?(
    context: CharacterGenerationContext,
    attempt: CharacterGenerationRepairRequest,
  ): Promise<CharacterGenerationProviderResult>;
}
