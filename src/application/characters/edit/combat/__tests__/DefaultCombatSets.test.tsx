import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { expect, it, vi } from 'vitest';
import { CreateDefaultDefense } from '@/domain/characters/combat/Defense';
import { CreateDefaultOffense, type Offense } from '@/domain/characters/combat/Offense';
import type { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import EditDefenseCard from '../EditDefenseCard';
import EditOffenseCard from '../offense/EditOffenseCard';

it('marks the selected offensive and defensive sets independently in Polish', async () => {
  const offenses = ['sword', 'bow'].map(id => ({ ...CreateDefaultOffense(), id }));
  const defenses = ['shield', 'parry'].map(id => ({ ...CreateDefaultDefense(), id }));
  const remove = vi.fn();
  const user = userEvent.setup();
  function CombatSets() {
    const form = useForm<CombatDto>({
      defaultValues: { offenses, defenses, defaultOffenseId: offenses[0].id, defaultDefenseId: defenses[0].id },
    });
    return (
      <FormProvider {...form}>
        <section aria-label="Ofensywy">
          {offenses.map((offense, index) => <EditOffenseCard key={offense.id} offense={offense} index={index} remove={remove} />)}
        </section>
        <section aria-label="Defensywy">
          {defenses.map((defense, index) => <EditDefenseCard key={defense.id} defense={defense} index={index} remove={remove} />)}
        </section>
      </FormProvider>
    );
  }
  render(<CombatSets />);
  const attack = within(screen.getByRole('region', { name: 'Ofensywy' }));
  const defense = within(screen.getByRole('region', { name: 'Defensywy' }));
  const firstAttack = attack.getByRole('button', { name: 'Domyślna', pressed: true });
  const firstDefense = defense.getByRole('button', { name: 'Domyślna', pressed: true });
  const nextAttack = attack.getByRole('button', { name: 'Ustaw jako domyślną', pressed: false });
  await user.click(nextAttack);
  expect(firstAttack).toHaveAccessibleName('Ustaw jako domyślną');
  expect(nextAttack).toHaveAccessibleName('Domyślna');
  expect(nextAttack).toHaveAttribute('aria-pressed', 'true');
  expect(firstDefense).toHaveAttribute('aria-pressed', 'true');
  await user.click(defense.getByRole('button', { name: 'Ustaw jako domyślną', pressed: false }));
  expect(firstDefense).toHaveAccessibleName('Ustaw jako domyślną');
  expect(firstDefense).toHaveAttribute('aria-pressed', 'false');
  expect(nextAttack).toHaveAttribute('aria-pressed', 'true');
});

function renderCombatEditor(offense: Offense) {
  const defense = CreateDefaultDefense();
  const remove = vi.fn();
  const saved = vi.fn<(data: CombatDto) => void>();
  const user = userEvent.setup();
  function Editor() {
    const form = useForm<CombatDto>({ defaultValues: { offenses: [offense], defenses: [defense] } });
    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(data => saved(structuredClone(data)))}>
          <section aria-label="Atak"><EditOffenseCard index={0} offense={offense} remove={remove} /></section>
          <section aria-label="Obrona"><EditDefenseCard index={0} defense={defense} remove={remove} /></section>
          <button type="submit">Zapisz</button>
        </form>
      </FormProvider>
    );
  }
  render(<Editor />);
  return {
    user,
    parts() {
      const [leading, secondary, damage, additional] = screen.getByRole('region', { name: 'Atak' })
        .querySelectorAll<HTMLElement>('[data-slot="card"] [data-slot="card"]');
      return { leading, secondary, damage, additional };
    },
    async save() {
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));
      return saved.mock.lastCall![0];
    },
  };
}

function controls(card: HTMLElement) {
  const header = within(card.querySelector<HTMLElement>('[data-slot="card-header"]')!);
  const content = within(card.querySelector<HTMLElement>('[data-slot="card-content"]')!);
  // The editor groups its icon buttons by dice count, grade, bonus, critical range and power.
  const [increaseAmount, decreaseAmount, increaseGrade, , increaseBonus, , increaseRange, , increasePower] = content.getAllByRole('button');
  const [reset, remove] = header.getAllByRole('button');
  return { increaseAmount, decreaseAmount, increaseGrade, increaseBonus, increaseRange, increasePower, phantom: content.getByRole('checkbox'), reset, remove };
}

it('restores the saved leading weapon and damage bonus independently, including phantom dice', { timeout: 15_000 }, async () => {
  const offense = CreateDefaultOffense();
  offense.damageBonus = { amount: 2, grade: 4, bonus: 2, isPhantom: true };
  const { user, parts, save } = renderCombatEditor(offense);
  const weapon = controls(parts().leading);
  const damage = controls(parts().damage);
  for (const button of [weapon.increaseAmount, weapon.increaseGrade, weapon.increaseBonus, weapon.increaseRange, weapon.increasePower, weapon.phantom]) {
    await user.click(button);
  }
  for (const button of [damage.decreaseAmount, damage.increaseGrade, damage.increaseBonus, damage.phantom]) {
    await user.click(button);
  }
  const edited = (await save()).offenses[0];
  expect(edited.leadingWeapon).toEqual({ amount: 2, grade: 4, bonus: 1, isPhantom: true, critical: { range: 1, power: 1 } });
  expect(edited.damageBonus).toEqual({ amount: 1, grade: 5, bonus: 3, isPhantom: false });
  await user.click(weapon.reset);
  expect(weapon.phantom).not.toBeChecked();
  const resetWeapon = (await save()).offenses[0];
  expect(resetWeapon.leadingWeapon).toEqual(offense.leadingWeapon);
  expect(resetWeapon.damageBonus).toEqual(edited.damageBonus);
  await user.click(damage.reset);
  expect(damage.phantom).toBeChecked();
  expect((await save()).offenses[0].damageBonus).toEqual(offense.damageBonus);
});

it('adds, edits and removes the optional weapon and bonus without changing the defense', { timeout: 15_000 }, async () => {
  const offense = CreateDefaultOffense();
  const { user, parts, save } = renderCombatEditor(offense);
  const defense = screen.getByRole('region', { name: 'Obrona' });
  const block = defense.querySelector<HTMLInputElement>('[name="defenses.0.block"]')!;
  await user.clear(block);
  await user.type(block, '7');
  await user.click(within(parts().secondary).getByRole('button'));
  await user.click(within(parts().additional).getByRole('button'));
  const weapon = controls(parts().secondary);
  const bonus = controls(parts().additional);
  for (const button of [weapon.increaseAmount, weapon.increaseGrade, weapon.increaseBonus, weapon.increaseRange, weapon.increasePower, weapon.phantom]) {
    await user.click(button);
  }
  for (const button of [bonus.decreaseAmount, bonus.increaseGrade, bonus.increaseBonus, bonus.phantom]) {
    await user.click(button);
  }
  const edited = await save();
  expect(edited.offenses[0].secondaryWeapon).toEqual({ amount: 2, grade: 4, bonus: 1, isPhantom: true, critical: { range: 1, power: 1 } });
  expect(edited.offenses[0].additionalDamageBonus).toEqual({ amount: 0, grade: 4, bonus: 1, isPhantom: true });
  expect(edited.offenses[0].leadingWeapon).toEqual(offense.leadingWeapon);
  await user.click(weapon.reset);
  await user.click(bonus.reset);
  const reset = (await save()).offenses[0];
  expect(reset.secondaryWeapon).toEqual(offense.leadingWeapon);
  expect(reset.additionalDamageBonus).toEqual(offense.damageBonus);
  await user.click(weapon.remove);
  await user.click(bonus.remove);
  const removed = await save();
  expect(removed.offenses[0].secondaryWeapon).toBeUndefined();
  expect(removed.offenses[0].additionalDamageBonus).toBeUndefined();
  expect(Number(removed.defenses[0].block)).toBe(7);
});
