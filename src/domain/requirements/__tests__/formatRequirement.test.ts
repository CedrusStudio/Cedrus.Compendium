import { describe, expect, it } from 'vitest';
import type { Requirement } from '../Requirement';
import { formatRequirement } from '../formatRequirement';

describe('requirement labels', () => {
  const cases: [Requirement, string][] = [
    [{ kind: 'ranked', group: 'powers', targetKey: 'wiez', value: 2 }, 'Więź ≥ 2'],
    [{ kind: 'ranked', group: 'powers', targetKey: 'legacy-power', value: 2 }, 'legacy-power ≥ 2'],
    [{ kind: 'ranked', group: 'derived', targetKey: 'dualWield', value: 1 }, 'walka dwiema broniami'],
    [{ kind: 'ranked', group: 'derived', targetKey: 'parry', value: 4 }, 'parowanie ≥ 4'],
    [{ kind: 'ranked', group: 'derived', targetKey: 'legacy-stat', value: 4 }, 'legacy-stat ≥ 4'],
    [{ kind: 'ranked', group: 'equipment', targetKey: 'shield', value: 3 }, 'co najmniej średnia tarcza'],
    [{ kind: 'ranked', group: 'equipment', targetKey: 'shield', value: 8 }, 'tarcza'],
    [{ kind: 'ranked', group: 'equipment', targetKey: 'armor.lekka', value: 1 }, 'lekka zbroja'],
    [{ kind: 'ranked', group: 'equipment', targetKey: 'legacy-armor', value: 1 }, 'legacy-armor ≥ 1'],
    [{ kind: 'sum', targets: [{ group: 'characteristics', targetKey: 'strength' }, { group: 'attributes', targetKey: 'fencing' }], value: 7 }, 'siła + fechtunek ≥ 7'],
    [{ kind: 'count', groups: ['maneuvers'], value: 2 }, 'manewry — co najmniej 2'],
    [{ kind: 'count', groups: ['maneuvers', 'stances'], value: 3, tag: 'lodowy', minGrade: 0 }, 'manewry + postawy („lodowy", ranga ≥ 0) — co najmniej 3'],
    [{ kind: 'anyOf', options: [{ kind: 'rankless', text: 'Zgoda dowódcy' }, { kind: 'ranked', group: 'powers', targetKey: 'moc', value: 2 }] }, 'Zgoda dowódcy lub Moc ≥ 2'],
  ];

  it.each(cases)('formats %j for the player', (requirement, expected) => {
    expect(formatRequirement(requirement)).toBe(expected);
  });
});
