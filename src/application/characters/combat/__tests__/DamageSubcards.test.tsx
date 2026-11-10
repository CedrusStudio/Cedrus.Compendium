import { useState, type PropsWithChildren } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DamageOffense, WeaponOffense } from '@/domain/characters/combat/Offense';
import { WeaponDamageWithCriticalSubcard } from '../offense/WeaponDamageWithCriticalSubcard';
import DamageBonusSubcard from '../offense/DamageBonusSubcard';
import { SpellOffenseSubcard } from '../power/SpellOffenseSubcard';
import SpellDamageSubcard from '../power/SpellDamageSubcard';

vi.mock('@/common/components/Subcard', () => ({
  default: ({ name, callback, children, childrenInfo }: PropsWithChildren<{
    name: string; callback: () => void; childrenInfo: React.ReactNode;
  }>) => (
    <section aria-label={name}>
      <button type="button" onClick={callback}>Reset damage</button>
      <div>{childrenInfo}</div>
      {children}
    </section>
  ),
}));

vi.mock('../offense/RollsView', () => ({
  default: ({ rolls, onReroll }: { rolls: unknown[]; onReroll: (index: number) => void }) => (
    <button type="button" onClick={() => onReroll(rolls.length - 1)}>Reroll last die</button>
  ),
}));

const base: DamageOffense = { amount: 1, grade: 1, bonus: 0, isPhantom: false };
const criticalBase: WeaponOffense = { ...base, critical: { power: 0, range: 0 } };

function controls()
{
  const view = within(screen.getByRole('region'));
  // The increment/decrement icon buttons are ordered by amount, grade and
  // bonus, followed by range and power in the critical subcards.
  const buttons = () => view.getAllByRole('button', { name: '' });
  const adjust = (field: 'amount' | 'grade' | 'bonus' | 'range' | 'power', direction: 'up' | 'down') => {
    const index = ['amount', 'grade', 'bonus', 'range', 'power'].indexOf(field) * 2;
    fireEvent.click(buttons()[index + (direction === 'down' ? 1 : 0)]);
  };
  return { view, adjust };
}

describe('damage subcards', () => {
  it.each(['weapon', 'spell attack'] as const)('edits the %s and rerolls with the edited offense', kind => {
    const reroll = vi.fn();
    function Harness()
    {
      const [offense, setOffense] = useState(criticalBase);
      const [rolls, setRolls] = useState<[number, boolean][]>([[2, false], [4, true]]);
      const common = { name: kind, rolls, setRolls, setOffense, resetCallback: () => setOffense(criticalBase) };
      return <>
        {kind === 'weapon'
          ? <WeaponDamageWithCriticalSubcard {...common} weaponOffense={offense} baseWeaponOffense={criticalBase} handleWeaponReroll={reroll} />
          : <SpellOffenseSubcard {...common} spellOffense={offense} baseSpellOffense={criticalBase} handleReroll={reroll} />}
        <output>{JSON.stringify(offense)}</output>
      </>;
    }
    render(<Harness />);
    const { view, adjust } = controls();
    const current = () => JSON.parse(screen.getByRole('status').textContent!);

    adjust('amount', 'down');
    adjust('amount', 'down');
    adjust('grade', 'down');
    adjust('range', 'down');
    adjust('range', 'down');
    expect(current()).toEqual({ ...criticalBase, amount: 0, critical: { power: 0, range: -1 } });

    adjust('amount', 'up');
    adjust('grade', 'up');
    adjust('bonus', 'down');
    adjust('range', 'up');
    adjust('power', 'up');
    const expected = { ...criticalBase, grade: 2, bonus: -1, critical: { power: 1, range: 0 } };
    expect(current()).toEqual(expected);
    fireEvent.click(view.getByRole('button', { name: 'Reroll last die' }));
    expect(reroll).toHaveBeenCalledExactlyOnceWith(1, expected, expect.any(Function));

    fireEvent.click(view.getByRole('button', { name: 'Reset damage' }));
    expect(current()).toEqual(criticalBase);
  });

  it.each(['damage bonus', 'spell damage'] as const)('keeps the lower bounds and resets %s', kind => {
    const reroll = vi.fn();
    function Harness()
    {
      const [damage, setDamage] = useState(base);
      const [rolls, setRolls] = useState([2, 4]);
      return <>
        {kind === 'damage bonus'
          ? <DamageBonusSubcard damageBonus={base} currentDamageBonus={damage} damageBonusRolls={rolls}
              setCurrentDamageBonus={setDamage} setDamageBonusRolls={setRolls} handleDamageOffenseReroll={reroll} />
          : <SpellDamageSubcard name={kind} spellDamage={damage} baseSpellDamage={base} rolls={rolls}
              setDamage={setDamage} setRolls={setRolls} handleReroll={reroll} resetCallback={() => setDamage(base)} />}
        <output>{JSON.stringify(damage)}</output>
      </>;
    }
    render(<Harness />);
    const { view, adjust } = controls();
    const current = () => JSON.parse(screen.getByRole('status').textContent!);
    adjust('amount', 'down');
    adjust('amount', 'down');
    adjust('grade', 'down');
    expect(current()).toEqual({ ...base, amount: 0 });

    adjust('amount', 'up');
    adjust('grade', 'up');
    adjust('bonus', 'down');
    const expected = { ...base, grade: 2, bonus: -1 };
    expect(current()).toEqual(expected);
    fireEvent.click(view.getByRole('button', { name: 'Reroll last die' }));
    expect(reroll).toHaveBeenCalledExactlyOnceWith(1, expected, expect.any(Function));

    fireEvent.click(view.getByRole('button', { name: 'Reset damage' }));
    expect(current()).toEqual(base);
  });
});
