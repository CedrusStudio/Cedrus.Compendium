import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '@/domain/combat-lab/engine/CombatLog';
import { describeEvent } from '../describeEvent';

const nameOf = (id: string) => ({ a: 'Aldara', b: 'Borowit' })[id as 'a' | 'b'] ?? id;
const attack = { actorId: 'a', targetId: 'b', raw: 12, reduced: 5, dealt: 7, remainingHp: 18, critical: false };
const ranged = { ...attack, attackRoll: 9, st: 8 };
const spell = { ...ranged, spellId: 's', spellName: 'Mróz', costEssence: 2, remainingEssence: 4 };

describe('combat replay descriptions', () => {
  const combat: [CombatEvent, string][] = [
    [{ kind: 'initiative', order: [{ id: 'a', roll: 12 }, { id: 'b', roll: 8 }] }, 'Inicjatywa: Aldara (12), Borowit (8)'],
    [{ kind: 'attack', ...attack, critical: true, immunityDice: 1, resistance: 2, reduction: 3 },
      'Aldara atakuje Borowit: wyrzucono 12 (traf. kryt.), zredukowano 5 (niewrażliwość −1k, odporność −2, redukcja −3) → zadano 7 → 18 HP'],
    [{ kind: 'attack', ...attack, immunityDice: 0, resistance: 0, reduction: 0 },
      'Aldara atakuje Borowit: wyrzucono 12, zredukowano 5 → zadano 7 → 18 HP'],
    [{ kind: 'rangedAttack', ...ranged, hit: true },
      'Aldara strzela do Borowit: trafienie (9 vs ST 8), wyrzucono 12, zredukowano 5 → zadano 7 → 18 HP'],
    [{ kind: 'rangedAttack', ...ranged, hit: false, attackRoll: 5 },
      'Aldara strzela do Borowit: pudło (5 vs ST 8)'],
    [{ kind: 'spellCast', ...spell, hit: true },
      'Aldara rzuca „Mróz" na Borowit: trafienie (9 vs ST 8), wyrzucono 12, zredukowano 5 → zadano 7 → 18 HP (esencja: 4)'],
    [{ kind: 'spellCast', ...spell, hit: false, attackRoll: 5 },
      'Aldara rzuca „Mróz" na Borowit: pudło (5 vs ST 8) (esencja: 4)'],
    [{ kind: 'statusTick', targetId: 'b', status: 'bleeding', amount: 2, remainingHp: 16 },
      'Borowit: Krwawienie zadaje 2 → 16 HP'],
    [{ kind: 'statusExpired', targetId: 'b', status: 'bleeding' }, 'Borowit: Krwawienie wygasa'],
    [{ kind: 'saveTest', targetId: 'b', roll: 4, st: 7, failMargin: 3, failed: true },
      'Test Borowit o ST 7: wynik 4 → porażka (o 3)'],
    [{ kind: 'saveTest', targetId: 'b', roll: 7, st: 7, failMargin: 0, failed: false },
      'Test Borowit o ST 7: wynik 7 → sukces'],
    [{ kind: 'combatEnd', reason: 'knockout', winnerId: 'a', rounds: 3 },
      'Koniec walki: zwycięża Aldara (knockout, 3 rund)'],
    [{ kind: 'combatEnd', reason: 'draw', winnerId: null, rounds: 8 },
      'Koniec walki: remis (draw, 8 rund)'],
  ];


  const modifiers: [CombatEvent, string][] = [
    [{ kind: 'rangedAttack', ...ranged, hit: true, critical: true }, 'wyrzucono 12 (traf. kryt.)'],
    [{ kind: 'spellCast', ...spell, hit: true, critical: true }, 'wyrzucono 12 (traf. kryt.)'],
    [{ kind: 'multiplier', sourceId: 'a', targetId: 'b', multiplierTarget: 'damageTaken', factor: 0.5, duration: 2 }, 'Borowit: otrzymywane obrażenia ×0.5 (2 r.)'],
    [{ kind: 'multiplier', sourceId: 'a', targetId: 'a', multiplierTarget: 'damageDealt', factor: 2, duration: 1 }, 'Aldara: zadawane obrażenia ×2 (1 r.)'],
    [{ kind: 'stanceRank', actorId: 'a', target: 'stance', delta: 1, duration: 2 }, 'Aldara: ranga postawy +1 (2 r.)'],
    [{ kind: 'stanceRank', actorId: 'a', target: 'state', delta: -2, duration: 1 }, 'Aldara: ranga stanu -2 (1 r.)'],
    [{ kind: 'stanceChange', actorId: 'a', from: null, to: 'Garda', grade: 2, timing: 'beforeAttack' }, 'Aldara zmienia postawę na „Garda" (ranga 2, przed atakiem)'],
    [{ kind: 'stanceChange', actorId: 'a', from: 'Garda', to: 'Unik', grade: 1, timing: 'afterAttack' }, 'Aldara zmienia postawę z „Garda" na „Unik" (ranga 1, po ataku)'],
    [{ kind: 'heal', sourceId: 'a', targetId: 'a', amount: 2, remainingHp: 19 }, 'Aldara leczy 2 → 19 HP'],
    [{ kind: 'statusApplied', sourceId: 'a', targetId: 'b', status: 'bleeding', duration: 2, stacks: 3 }, 'Borowit: Krwawienie (2 rund, x3)'],
    [{ kind: 'control', sourceId: 'a', targetId: 'b', control: 'custom-control', duration: 2 }, 'Borowit: custom-control (2 rund)'],
    [{ kind: 'move', sourceId: 'a', targetId: 'b', direction: 'push', distance: 2 }, 'Borowit: odepchnięty o 2'],
    [{ kind: 'move', sourceId: 'a', targetId: 'b', direction: 'pull', distance: 1 }, 'Borowit: przyciągnięty o 1'],
    [{ kind: 'resource', targetId: 'a', resource: 'essence', delta: 2 }, '+2'],
    [{ kind: 'resource', targetId: 'b', resource: 'custom-counter', delta: -1 }, 'Borowit: custom-counter -1'],
    [{ kind: 'buff', sourceId: 'a', targetId: 'a', profileId: 'guard', duration: 1, mode: 'buff' }, 'Aldara: wzmocnienie (1 rund)'],
    [{ kind: 'buff', sourceId: 'a', targetId: 'b', profileId: 'guard', duration: 2, mode: 'debuff' }, 'Borowit: osłabienie (2 rund)'],
    [{ kind: 'contestedTest', sourceId: 'a', targetId: 'b', attackerResult: 9, defenderResult: 8, margin: 1, win: true }, '9 vs 8 (margines +1) → wygrana'],
    [{ kind: 'contestedTest', sourceId: 'a', targetId: 'b', attackerResult: 4, defenderResult: 7, margin: -3, win: false }, '4 vs 7 (margines -3) → przegrana'],
    [{ kind: 'chanceRolled', sourceId: 'a', chance: 45, passed: true }, 'Rzut na szansę 45%: sukces'],
    [{ kind: 'chanceRolled', sourceId: 'a', chance: 45, passed: false }, 'Rzut na szansę 45%: porażka'],
    [{ kind: 'pass', actorId: 'b', reason: 'controlled' }, 'Borowit pomija turę (controlled)'],
  ];

  it.each(modifiers)('shows the modifier or event result: %j', (event, text) => {
    expect(describeEvent(event, nameOf)).toContain(text);
  });

  it.each(combat)('keeps the recorded combat outcome visible: %j', (event, text) => {
    expect(describeEvent(event, nameOf)).toBe(text);
  });
});
