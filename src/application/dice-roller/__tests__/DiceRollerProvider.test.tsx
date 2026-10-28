import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import DiceRollerProvider, { useDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';
import { useCombatRolls } from '@/application/characters/combat/useCombatRolls';
import type { Offense } from '@/domain/characters/combat/Offense';

function Page() {
  const [page, setPage] = useState('one');
  const dice = useDiceRoller();
  return <><span>{page}</span><button onClick={() => dice.open()}>{diceText.open}</button><button onClick={() => setPage('two')}>Navigate</button></>;
}

describe('global dice panel', () => {
  it('preserves a roll and its history when the page content changes and the panel closes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<DiceRollerProvider><Page /></DiceRollerProvider>);
    fireEvent.click(screen.getByRole('button', { name: diceText.open }));
    fireEvent.click(screen.getByRole('button', { name: diceText.roll }));
    expect(screen.getByText('1', { selector: '.text-4xl' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
    fireEvent.click(screen.getByRole('button', { name: diceText.close }));
    fireEvent.click(screen.getByRole('button', { name: diceText.open }));
    expect(screen.getByText('1', { selector: '.text-4xl' })).toBeInTheDocument();
    expect(screen.getByText(/k6 \[1\]/)).toBeInTheDocument();
  });

  it('records an existing combat roll and its single-die reroll without drawing twice', () => {
    const offense: Offense = { id: 'one', name: 'Sword', leadingWeapon: { amount: 1, grade: 3, bonus: 2, isPhantom: false, critical: { range: 0, power: 0 } }, damageBonus: { amount: 0, grade: 3, bonus: 1, isPhantom: false } };
    const offenses = [offense];
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5);
    function Combat() {
      const rolls = useCombatRolls(offenses);
      const dice = useDiceRoller();
      return <><button onClick={rolls.handleRoll}>Combat roll</button><button onClick={() => rolls.handleWeaponReroll(0, rolls.currentLeadingOffense, rolls.setLeadingRolls)}>Reroll weapon</button><span data-testid="total">{rolls.totalResult()}</span><span data-testid="history">{dice.history.length}</span></>;
    }
    render(<DiceRollerProvider><Combat /></DiceRollerProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Combat roll' }));
    expect(screen.getByTestId('total')).toHaveTextContent('4');
    expect(screen.getByTestId('history')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Reroll weapon' }));
    expect(screen.getByTestId('total')).toHaveTextContent('7');
    expect(screen.getByTestId('history')).toHaveTextContent('2');
    expect(random).toHaveBeenCalledTimes(2);
  });

  it('adds and removes dice groups and clears history with an inline confirmation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const nativeConfirm = vi.spyOn(window, 'confirm');
    render(<DiceRollerProvider><Page /></DiceRollerProvider>);
    fireEvent.click(screen.getByRole('button', { name: diceText.open }));
    fireEvent.change(screen.getAllByLabelText(diceText.count)[0], { target: { value: '4' } });
    fireEvent.change(screen.getAllByLabelText(diceText.bonus, { exact: true })[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: `+ ${diceText.addGroup}` }));
    fireEvent.change(screen.getAllByLabelText(diceText.count)[1], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText(diceText.kind)[1], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText(diceText.bonus, { exact: true })[1], { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(diceText.modifier), { target: { value: '3' } });
    expect(screen.getByText('4(k6+1) + 2(k4+2) + 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: diceText.roll }));
    expect(screen.getByText('17', { selector: '.text-4xl' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: diceText.clear }));
    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(diceText.confirm)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: diceText.cancel }));
    expect(screen.getByText('17', { selector: '.text-4xl' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `${diceText.removeGroup} 2` }));
    expect(screen.getAllByLabelText(diceText.count)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: diceText.clear }));
    fireEvent.click(screen.getByRole('button', { name: diceText.clearNow }));
    expect(screen.getByText(diceText.noHistory)).toBeInTheDocument();
  });
});
