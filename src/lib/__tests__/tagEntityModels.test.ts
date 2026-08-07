import { describe, expect, it } from 'vitest';
import { searchEntityToTagEntity, tagEntityCollectionMap, tagEntityModelMap } from '@/lib/tagEntityModels';

/**
 * These maps are the seams between three vocabularies (search payload, Prisma
 * model, Mongo collection). A hole in any of them fails SILENTLY — an unmapped
 * search entity yields no facet conditions and the filter just stops narrowing —
 * so the contract is asserted rather than trusted.
 */
describe('tag entity maps', () => {
  it('covers every tag-management entity with a collection name', () => {
    expect(Object.keys(tagEntityCollectionMap).sort()).toEqual(Object.keys(tagEntityModelMap).sort());
  });

  it('maps every search entity onto a real tag-management entity', () => {
    for (const [searchEntity, tagEntity] of Object.entries(searchEntityToTagEntity))
    {
      expect(tagEntityModelMap[tagEntity], `${searchEntity} → ${tagEntity}`).toBeDefined();
    }
  });

  it('reaches every tag-management entity from some search entity', () => {
    const reachable = new Set(Object.values(searchEntityToTagEntity));

    expect([...Object.keys(tagEntityModelMap)].filter(entity => !reachable.has(entity))).toEqual([]);
  });

  it('keeps the two names that genuinely differ', () => {
    expect(searchEntityToTagEntity['inventoryItem']).toBe('inventory');
    expect(tagEntityCollectionMap['powerSpecifications']).toBe('PowerSpecification');
  });
});
