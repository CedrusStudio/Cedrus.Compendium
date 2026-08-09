/**
 * Alias validation (Wave 10.5).
 *
 * An alias is the one place in the facet layer where a mistake produces a
 * SILENTLY WRONG search result rather than a visible error: nothing throws, the
 * list just quietly contains the wrong rows. Hence three rules, enforced server
 * side rather than left to the panel.
 *
 * Pure, so the API and the admin preview check exactly the same thing.
 */

import type { TagAliasDefinition, TagDefinitionRecord, TagFacetDefinition } from "@/domain/tags/tagFacets";

export type AliasViolation = { rule: "canonical-elsewhere" | "duplicate-in-facet" | "entity-outside-facet"; message: string };

export function validateTagAlias(
  definition: TagDefinitionRecord,
  alias: TagAliasDefinition,
  facets: readonly TagFacetDefinition[],
  definitions: readonly TagDefinitionRecord[],
): AliasViolation[]
{
  const violations: AliasViolation[] = [];
  const facet = facets.find(candidate => candidate.key === definition.facetKey);
  const siblings = definitions.filter(candidate => candidate.tag !== definition.tag && candidate.facetKey === definition.facetKey);

  // 1. The alias must not be another definition's canonical name in the same
  //    facet. `natura` IS canonical for the school of magic, so it may only ever
  //    be an alias for entities where that meaning does not apply.
  const canonicalOwner = siblings.find(candidate => candidate.tag === alias.alias);
  if (canonicalOwner)
  {
    violations.push({
      rule: "canonical-elsewhere",
      message: `„${alias.alias}" jest już kanonicznym tagiem w tym samym facecie (${canonicalOwner.tag}).`,
    });
  }

  // 2. Two definitions in one facet must not claim the same alias for the same
  //    entity — the value a record matches would then depend on iteration order.
  for (const sibling of siblings)
  {
    for (const other of sibling.aliases ?? [])
    {
      if (other.alias !== alias.alias) continue;
      const overlap = other.entities.filter(entity => alias.entities.includes(entity));
      if (overlap.length === 0) continue;

      violations.push({
        rule: "duplicate-in-facet",
        message: `„${alias.alias}" jest już aliasem tagu ${sibling.tag} dla: ${overlap.join(", ")}.`,
      });
    }
  }

  // 3. An alias scoped to an entity the facet does not cover is dead code that
  //    nobody will ever notice is dead.
  if (facet)
  {
    const outside = alias.entities.filter(entity => !facet.entities.includes(entity));
    if (outside.length > 0)
    {
      violations.push({
        rule: "entity-outside-facet",
        message: `Facet ${facet.key} nie obejmuje: ${outside.join(", ")} — alias byłby martwy.`,
      });
    }
  }

  return violations;
}

/** Every violation across a definition's aliases. */
export function validateTagDefinitionAliases(
  definition: TagDefinitionRecord,
  facets: readonly TagFacetDefinition[],
  definitions: readonly TagDefinitionRecord[],
): AliasViolation[]
{
  return (definition.aliases ?? []).flatMap(alias => validateTagAlias(definition, alias, facets, definitions));
}
