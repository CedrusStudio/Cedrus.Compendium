import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';

/**
 * Review notes about the combat sheet, measured rather than asserted.
 *
 * Everything here comes from the 219 offence sets in the compendium, counted
 * over the 191 that hold a real attack pool. Only the findings the data
 * actually supports are reported: telling a reviewer that a zero critical is
 * wrong would be false, because a quarter of the compendium's warriors have
 * one, and a check that cries wolf is a check people learn to skip.
 *
 * Reporting only, like `checkRequirement` and `compareToBalanceProfile`. An
 * unusual character is unusual, not wrong, and telling those apart is the
 * reviewer's job.
 */

/**
 * A one-die attack pool is what you get by copying a weapon's own entry and
 * forgetting that the character's training adds dice.
 *
 * Measured: 4.2% of all attack sets roll a single die, and among characters
 * tagged wojak, rycerz, wojownik or szermierz — 52 sets — not one does. It is
 * the strongest single signal in the offence data.
 */
const RARE_POOL_AMOUNT = 1;

/**
 * Measured on the 154 attack sets belonging to characters that carry any perks,
 * maneuvers or stances: median critical power 3, and 10.4% at zero. Among the
 * 52 warriors the zero cases are 23%, and all twelve are tavern brawlers —
 * Chłop, Karczmienny, Wioskowy, Oprych, Pięściarz, Amator.
 *
 * The reason is the gear, not the character. Fourteen weapons in the compendium
 * carry a NEGATIVE critical power: „Walka Wręcz" is −3, „Żelazne Rękawice" −3,
 * „Prymitywna Włócznia" −2, and the ordinary „Włócznia" sits at 0. A trained
 * fighter with a spear or with bare fists lands at zero honestly, so the note
 * only fires when every weapon the character carries would ADD to the critical
 * and the sheet still says zero — that is the case gear cannot explain.
 */
const BUILT_CHARACTER_CRITICAL_POWER = 1;

type EquippedWeapon = { offense?: { critical?: { power?: number } } };

/**
 * Whether the character's gear could account for a zero critical.
 *
 * A character with no weapons fights unarmed, which is the biggest penalty in
 * the compendium, so „no weapons" counts as an explanation rather than as an
 * absence of one.
 */
function gearExplainsZeroCritical(weapons: readonly EquippedWeapon[]): boolean
{
  return weapons.length === 0
    || weapons.some(weapon => (weapon.offense?.critical?.power ?? 0) <= 0);
}

const describePool = (pool: { amount: number; grade: number; bonus: number }) =>
  `${pool.amount}k${pool.grade * 2}${pool.bonus === 0 ? '' : pool.bonus > 0 ? `+${pool.bonus}` : String(pool.bonus)}`;

export function reviewAiCharacterProposalCombat(proposal: AiCharacterProposal): string[]
{
  const notes: string[] = [];
  const { combat } = proposal;

  // A character with nothing on its sheet is a plain statblock, and the
  // conventions below are measured on characters that have been built.
  const isBuilt = proposal.perks.length + combat.maneuvers.length + combat.stances.length > 0;
  const gearMayExplain = gearExplainsZeroCritical(proposal.equipment.weapons as EquippedWeapon[]);

  for (const offense of combat.offenses) {
    const leading = offense.leadingWeapon;

    if (isBuilt && !gearMayExplain && leading.amount > 0 && leading.critical.power < BUILT_CHARACTER_CRITICAL_POWER) {
      notes.push(
        `Zestaw ataku „${offense.name}" ma siłę krytyka 0, choć żadna z broni tej postaci jej nie obniża. `
        + 'Mediana zbudowanej postaci to 3 — zero należy się włóczni albo walce wręcz, nie mieczowi.',
      );
    }

    if (leading.amount === RARE_POOL_AMOUNT) {
      notes.push(
        `Zestaw ataku „${offense.name}" ma pulę jednej kości (${describePool(leading)}). `
        + 'W kompendium tak walczy 4% postaci, a wśród wojaków i rycerzy żadna — '
        + 'zwykle to znak, że przepisano statystyki broni bez wyszkolenia postaci.',
      );
    }

    if (leading.amount === 0) {
      notes.push(
        `Zestaw ataku „${offense.name}" nie ma czym atakować: pula broni wiodącej wynosi 0.`,
      );
    }

    // A second weapon that rolls nothing is not a second weapon; it is an
    // optional field filled with zeros instead of left out.
    if (offense.secondaryWeapon && offense.secondaryWeapon.amount === 0) {
      notes.push(
        `Zestaw ataku „${offense.name}" ma broń drugorzędną z pulą 0 — jeśli postać walczy jedną bronią, `
        + 'to pole powinno zostać puste.',
      );
    }
  }

  if (combat.offenses.length > 0 && !combat.defaultOffenseId) {
    notes.push('Żaden zestaw ataku nie jest domyślny, więc karta postaci nie wie, czym postać walczy.');
  }

  if (combat.defenses.length > 0 && !combat.defaultDefenseId) {
    notes.push('Żaden zestaw obrony nie jest domyślny, więc karta postaci nie wie, czym postać się broni.');
  }

  return notes;
}
