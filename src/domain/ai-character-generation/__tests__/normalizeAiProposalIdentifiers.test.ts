import { describe, expect, it, vi } from 'vitest';

// The shared setup pins `ulid` to one constant, which would make every minted
// identifier equal and hide the very collisions this suite is about. A plain
// counter is used instead of `vi.fn` so the global `restoreAllMocks` in
// `afterEach` cannot strip the implementation.
vi.mock('ulid', () => {
  let counter = 0;
  return { ulid: () => `01ARZ3NDEKTSV4RRFFQ69G5F${String(counter++ % 100).padStart(2, '0')}` };
});

import {
  buildCatalogIdentityIndex,
  normalizeAiProposalIdentifiers,
} from '@/domain/ai-character-generation/normalizeAiProposalIdentifiers';

const ULID = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;
const CATALOG_STANCE_ID = '01J0000000000000000000000A';

type Proposal = Record<string, unknown>;

function proposal(overrides: Proposal = {}): Proposal
{
  return {
    header: { raceId: 'race-from-catalog' },
    perks: [],
    talents: { talents: [] },
    equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
    combat: {
      defenses: [],
      offenses: [],
      powers: [],
      stances: [],
      states: [],
      maneuvers: [],
      defaultDefenseId: null,
      defaultOffenseId: null,
    },
    buffs: {
      buffProfiles: [],
      activeBuffProfileIds: [],
      stanceModifierProfiles: [],
      activeStanceModifierProfileIds: [],
      stateModifierProfiles: [],
      activeStateModifierProfileIds: [],
      otherModifierProfiles: [],
      activeOtherModifierProfileIds: [],
    },
    warnings: [],
    ...overrides,
  };
}

describe('normalizeAiProposalIdentifiers', () => {
  it('mints ULIDs for identifiers the draft owns', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      talents: { talents: [{ id: 't1' }] },
    })) as Proposal;

    const talents = (result.talents as Proposal).talents as { id: string }[];
    expect(talents[0].id).toMatch(ULID);
  });

  it('drops equipment the model did not take from the compendium', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      equipment: {
        weapons: [{ id: CATALOG_STANCE_ID, name: 'Miecz z katalogu' }, { id: 'wymyslony-miecz' }],
        armors: [], shields: [], inventory: [], mounts: [],
      },
    })) as Proposal;

    const weapons = (result.equipment as Proposal).weapons as { id: string }[];
    expect(weapons).toHaveLength(1);
    expect(weapons[0].id).toBe(CATALOG_STANCE_ID);
    expect(result.warnings).toHaveLength(1);
  });

  it('keeps a reference pointing at the entry it named', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        defenses: [{ id: 'd1' }],
        defaultDefenseId: 'd1',
      },
      buffs: {
        ...(proposal().buffs as Proposal),
        buffProfiles: [{ id: 'p1' }, { id: 'p2' }],
        activeBuffProfileIds: ['p2'],
      },
    })) as Proposal;

    const combat = result.combat as Proposal;
    const buffs = result.buffs as Proposal;
    const defenses = combat.defenses as { id: string }[];
    const profiles = buffs.buffProfiles as { id: string }[];

    expect(combat.defaultDefenseId).toBe(defenses[0].id);
    expect(buffs.activeBuffProfileIds).toEqual([profiles[1].id]);
  });

  it('does not merge the same placeholder used in two different collections', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        defenses: [{ id: '1' }],
        offenses: [{ id: '1' }],
      },
    })) as Proposal;

    const combat = result.combat as Proposal;
    const defenseId = (combat.defenses as { id: string }[])[0].id;
    const offenseId = (combat.offenses as { id: string }[])[0].id;

    expect(defenseId).not.toBe(offenseId);
  });

  it('keeps a catalog identifier and drops an invented one beside it', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        stances: [{ id: CATALOG_STANCE_ID }],
        maneuvers: [{ id: 'invented-maneuver' }],
      },
    })) as Proposal;

    const combat = result.combat as Proposal;
    expect((combat.stances as { id: string }[])[0].id).toBe(CATALOG_STANCE_ID);
    expect(combat.maneuvers).toHaveLength(0);
  });

  it('never rewrites the race, which is a global reference either way', () => {
    // Left as-is so acceptance validation can report it instead of the
    // normaliser silently pointing the character at a different race.
    const result = normalizeAiProposalIdentifiers(proposal()) as Proposal;

    expect((result.header as Proposal).raceId).toBe('race-from-catalog');
  });

  it('preserves an identifier that is already a ULID', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      talents: { talents: [{ id: CATALOG_STANCE_ID }] },
    })) as Proposal;

    expect(((result.talents as Proposal).talents as { id: string }[])[0].id).toBe(CATALOG_STANCE_ID);
  });

  it('drops references to entries that were never declared and says so', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      buffs: {
        ...(proposal().buffs as Proposal),
        buffProfiles: [{ id: 'p1', linkedEntityId: 'a-stance-that-does-not-exist' }],
        activeBuffProfileIds: ['p1', 'ghost'],
      },
    })) as Proposal;

    const buffs = result.buffs as Proposal;
    const profiles = buffs.buffProfiles as { id: string; linkedEntityId: string | null }[];

    expect(buffs.activeBuffProfileIds).toEqual([profiles[0].id]);
    expect(profiles[0].linkedEntityId).toBeNull();
    expect(result.warnings).toHaveLength(1);
  });

  it('keeps authored equipment when the request allowed it', () => {
    const result = normalizeAiProposalIdentifiers(proposal({
      equipment: {
        weapons: [{ id: 'wymyslony-miecz', name: 'Miecz barona' }],
        armors: [], shields: [], inventory: [], mounts: [],
      },
    }), { allowCustomEquipment: true }) as Proposal;

    const weapons = (result.equipment as Proposal).weapons as { id: string }[];
    expect(weapons).toHaveLength(1);
    expect(weapons[0].id).toMatch(ULID);
  });

  it('drops an authored perk when the request did not allow one', () => {
    const strict = normalizeAiProposalIdentifiers(proposal({
      perks: [{ id: 'wymyslony-atut', name: 'Fintowanie' }],
    })) as Proposal;
    const permissive = normalizeAiProposalIdentifiers(proposal({
      perks: [{ id: 'wymyslony-atut', name: 'Fintowanie' }],
    }), { allowCustomAbilities: true }) as Proposal;

    expect(strict.perks).toHaveLength(0);
    expect(permissive.perks).toHaveLength(1);
    expect((permissive.perks as { id: string }[])[0].id).toMatch(ULID);
  });

  it('repairs an identifier that points at a different catalog entry', () => {
    // Straight from a real draft: the model wrote „Nagła Zasłona" and pasted the
    // identifier of „Wyrównanie". Both are real ids, so nothing downstream would
    // have noticed the character being linked to the wrong maneuver.
    const naglaZaslona = '01ARZ3NDEKTSV4RRFFQ69G5F01';
    const wyrownanie = '01ARZ3NDEKTSV4RRFFQ69G5F02';
    const catalog = buildCatalogIdentityIndex([
      { id: naglaZaslona, name: 'Nagła Zasłona', grade: 1 },
      { id: wyrownanie, name: 'Wyrównanie', grade: 3 },
    ]);

    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        maneuvers: [{ id: wyrownanie, name: 'Nagła Zasłona', grade: 1 }],
      },
    }), { catalog }) as Proposal;

    const maneuvers = (result.combat as Proposal).maneuvers as { id: string }[];
    expect(maneuvers[0].id).toBe(naglaZaslona);
    expect(result.warnings).toHaveLength(1);
  });

  it('recovers an entry whose identifier is not a ULID at all', () => {
    const odwet = '01ARZ3NDEKTSV4RRFFQ69G5F03';
    const catalog = buildCatalogIdentityIndex([{ id: odwet, name: 'Odwet', grade: 1 }]);

    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        maneuvers: [{ id: 'odwet-1', name: 'Odwet', grade: 1 }],
      },
    }), { catalog }) as Proposal;

    expect(((result.combat as Proposal).maneuvers as { id: string }[])[0].id).toBe(odwet);
  });

  it('still drops an entry whose name is not in the catalog either', () => {
    const catalog = buildCatalogIdentityIndex([{ id: '01ARZ3NDEKTSV4RRFFQ69G5F04', name: 'Finta', grade: 1 }]);

    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        maneuvers: [{ id: 'x', name: 'Manewr Którego Nie Ma', grade: 1 }],
      },
    }), { catalog }) as Proposal;

    expect((result.combat as Proposal).maneuvers).toHaveLength(0);
  });

  it('leaves an entry alone when identifier and name already agree', () => {
    const finta = '01ARZ3NDEKTSV4RRFFQ69G5F05';
    const catalog = buildCatalogIdentityIndex([{ id: finta, name: 'Finta', grade: 2 }]);

    const result = normalizeAiProposalIdentifiers(proposal({
      combat: {
        ...(proposal().combat as Proposal),
        maneuvers: [{ id: finta, name: 'Finta', grade: 2 }],
      },
    }), { catalog }) as Proposal;

    expect(((result.combat as Proposal).maneuvers as { id: string }[])[0].id).toBe(finta);
    expect(result.warnings).toHaveLength(0);
  });

  it('ignores a payload that is not an object', () => {
    expect(normalizeAiProposalIdentifiers('nope')).toBe('nope');
    expect(normalizeAiProposalIdentifiers(null)).toBeNull();
  });
});
