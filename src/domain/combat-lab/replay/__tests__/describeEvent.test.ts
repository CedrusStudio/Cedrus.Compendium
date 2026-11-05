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

  it.each(combat)('keeps the recorded combat outcome visible: %j', (event, text) => {
    expect(describeEvent(event, nameOf)).toBe(text);
  });
});
