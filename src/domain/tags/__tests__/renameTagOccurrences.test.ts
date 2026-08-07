import { describe, expect, it } from 'vitest';
import {
  isTagMerge,
  personalizationContextsForEntity,
  renameInTagList,
  renameTagInProfile,
  renameTagInRequirements,
} from '@/domain/tags/renameTagOccurrences';
import { createEmptyProfile } from '@/common/personalization/personalizationProfile';

describe('renameInTagList', () => {
  it('returns null when the old tag is absent, so callers can skip the write', () => {
    expect(renameInTagList(['ofensywa', 'krytyk'], 'defensywne', 'defensywa')).toBeNull();
  });

  it('replaces the tag in place, preserving order', () => {
    expect(renameInTagList(['fortel', 'ofensywne', 'krytyk'], 'ofensywne', 'ofensywa'))
      .toEqual(['fortel', 'ofensywa', 'krytyk']);
  });

  it('collapses to one entry when the record already carries both names', () => {
    expect(renameInTagList(['ofensywne', 'krytyk', 'ofensywa'], 'ofensywne', 'ofensywa'))
      .toEqual(['ofensywa', 'krytyk']);
  });

  it('flags the merge case separately from a plain swap', () => {
    expect(isTagMerge(['ofensywne', 'ofensywa'], 'ofensywne', 'ofensywa')).toBe(true);
    expect(isTagMerge(['ofensywne'], 'ofensywne', 'ofensywa')).toBe(false);
  });
});

describe('renameTagInRequirements', () => {
  it('repoints a count requirement and reports the occurrence', () => {
    const requirements = [
      { kind: 'count', groups: ['maneuvers'], tag: 'okrzyki', value: 2 },
      { kind: 'ranked', group: 'perks', targetKey: 'Fechtunek', value: 3 },
    ];

    const { value, occurrences } = renameTagInRequirements(requirements, 'okrzyki', 'okrzyki-bojowe');

    expect(occurrences).toBe(1);
    expect(value).toEqual([
      { kind: 'count', groups: ['maneuvers'], tag: 'okrzyki-bojowe', value: 2 },
      { kind: 'ranked', group: 'perks', targetKey: 'Fechtunek', value: 3 },
    ]);
  });

  it('leaves a different tag alone and reports zero occurrences', () => {
    const requirements = [{ kind: 'count', groups: ['maneuvers'], tag: 'widmowy', value: 2 }];

    const { value, occurrences } = renameTagInRequirements(requirements, 'okrzyki', 'okrzyki-bojowe');

    expect(occurrences).toBe(0);
    expect(value).toEqual(requirements);
  });

  it('reaches a tag nested inside an alternative, even though anyOf cannot hold count today', () => {
    const requirements = [
      { kind: 'anyOf', options: [{ kind: 'count', groups: ['perks'], tag: 'ofensywa', value: 5 }] },
    ];

    const { value, occurrences } = renameTagInRequirements(requirements, 'ofensywa', 'ofensywne');

    expect(occurrences).toBe(1);
    expect(value).toEqual([
      { kind: 'anyOf', options: [{ kind: 'count', groups: ['perks'], tag: 'ofensywne', value: 5 }] },
    ]);
  });

  it('does not touch a value that merely equals the tag under another key', () => {
    const requirements = [{ kind: 'rankless', text: 'ofensywa' }];

    const { occurrences } = renameTagInRequirements(requirements, 'ofensywa', 'ofensywne');

    expect(occurrences).toBe(0);
  });
});

describe('personalizationContextsForEntity', () => {
  it('maps powerSpecifications to the profile\'s own name for it', () => {
    expect(personalizationContextsForEntity('powerSpecifications')).toEqual(['powers']);
  });

  it('reaches both character-backed contexts', () => {
    expect(personalizationContextsForEntity('characters')).toEqual(['characters', 'bestiary']);
  });

  it('returns nothing for an entity the profile does not know', () => {
    expect(personalizationContextsForEntity('unknown')).toEqual([]);
  });
});

describe('renameTagInProfile', () => {
  it('rewrites both the including and the excluding quick tags', () => {
    const profile = {
      ...createEmptyProfile(),
      quickTagsByContext: { maneuvers: ['ofensywne', 'krytyk'] },
      quickExcludeTagsByContext: { maneuvers: ['ofensywne'] },
    };

    const result = renameTagInProfile(profile, ['maneuvers'], 'ofensywne', 'ofensywa');

    expect(result?.quickTagsByContext).toEqual({ maneuvers: ['ofensywa', 'krytyk'] });
    expect(result?.quickExcludeTagsByContext).toEqual({ maneuvers: ['ofensywa'] });
  });

  it('leaves other contexts alone — a Maneuver rename must not touch Perk quick tags', () => {
    const profile = {
      ...createEmptyProfile(),
      quickTagsByContext: { maneuvers: ['ofensywne'], perks: ['ofensywne'] },
    };

    const result = renameTagInProfile(profile, ['maneuvers'], 'ofensywne', 'ofensywa');

    expect(result?.quickTagsByContext).toEqual({ maneuvers: ['ofensywa'], perks: ['ofensywne'] });
  });

  it('returns null when the profile does not use the tag', () => {
    const profile = { ...createEmptyProfile(), quickTagsByContext: { maneuvers: ['krytyk'] } };

    expect(renameTagInProfile(profile, ['maneuvers'], 'ofensywne', 'ofensywa')).toBeNull();
  });

  it('de-duplicates when the user had both names pinned', () => {
    const profile = {
      ...createEmptyProfile(),
      quickTagsByContext: { maneuvers: ['ofensywne', 'ofensywa'] },
    };

    const result = renameTagInProfile(profile, ['maneuvers'], 'ofensywne', 'ofensywa');

    expect(result?.quickTagsByContext).toEqual({ maneuvers: ['ofensywa'] });
  });
});
