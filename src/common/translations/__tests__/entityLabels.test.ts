import { describe, expect, it } from 'vitest';
import { entityLabel, entityLabels, untranslatedEntities } from '@/common/translations/entityLabels';

describe('entityLabels', () => {
  /**
   * The internal vocabulary (`maneuvers`, `powerSpecifications`) is not meant for
   * humans. The admin panel printed it raw until Wave 10.7, so the completeness
   * of this map is now asserted rather than assumed — a new entity cannot ship
   * without a Polish name.
   */
  it('names every tag-management entity', () => {
    expect(untranslatedEntities()).toEqual([]);
  });

  it('joins a list the way the panel shows it', () => {
    expect(entityLabels(['maneuvers', 'perks'])).toBe('Manewry, Atuty');
  });

  it('falls back to the raw key so a gap is visible, not blank', () => {
    expect(entityLabel('somethingNew')).toBe('somethingNew');
  });

  it('spells `Zaklęcia` correctly — the old copy in /admin/tags did not', () => {
    expect(entityLabel('spells')).toBe('Zaklęcia');
  });
});
