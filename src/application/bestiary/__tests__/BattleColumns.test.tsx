import { useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type RowSelectionState } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { expect, it, vi } from 'vitest';
import { displayedText } from '@/common/translations';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';
import { CreateEmptyCharacter, type Character } from '@/domain/characters/Character';
import { reducer as bestiaryReducer } from '@/persistence/slices/bestiarySlice';
import { columns } from '../columns';

const { open, record, rollInitiative } = vi.hoisted(() => ({
  open: vi.fn(), record: vi.fn(), rollInitiative: vi.fn(() => 14),
}));

vi.mock('@/application/dice-roller/DiceRollerProvider', () => ({
  useOptionalDiceRoller: () => ({ open, record }),
}));

vi.mock('@/domain/characters/statistics/Attributes', async importOriginal => ({
  ...(await importOriginal<typeof import('@/domain/characters/statistics/Attributes')>()),
  rollInitiative,
}));

vi.mock('@/application/bestiary/views/CharacterDefensesBattleView', () => ({
  default: ({ character }: { character: Character }) => <span>Defense of {character.shortName}</span>,
}));

vi.mock('@/application/bestiary/views/CharacterOffensesBattleView', () => ({
  default: ({ character }: { character: Character }) => <span>Offense of {character.shortName}</span>,
}));

vi.mock('@/application/bestiary/views/CharacterPowersBattleView', () => ({
  default: ({ character }: { character: Character }) => <span>Power of {character.shortName}</span>,
}));

vi.mock('@/application/bestiary/CharacterMoreActionsMenu', () => ({
  default: ({ extraMenuItems }: { extraMenuItems: React.ReactNode }) => <>{extraMenuItems}</>,
}));

vi.mock('@/ui/dropdown-menu', () => ({
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

type Row = Character & { __initiative: number | null };

function character(name: string, initiative: number | null): Row
{
  return {
    ...CreateEmptyCharacter({ name, shortName: name, tags: ['straż'], description: 'Strażnik północny' }),
    id: name,
    __initiative: initiative,
  };
}

function BattleTable({ data }: { data: Row[] })
{
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useReactTable({
    data, columns, state: { rowSelection }, onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getRowId: row => row.id,
  });
  return (
    <table>
      <thead>{table.getHeaderGroups().map(group => (
        <tr key={group.id}>{group.headers.map(header => (
          <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
        ))}</tr>
      ))}</thead>
      <tbody>{table.getRowModel().rows.map(row => (
        <tr key={row.id} aria-label={row.original.name}>{row.getVisibleCells().map(cell => (
          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
        ))}</tr>
      ))}</tbody>
    </table>
  );
}

function renderBattle(data: Row[])
{
  sessionStorage.clear();
  const store = configureStore({ reducer: { bestiary: bestiaryReducer } });
  render(<Provider store={store}><BattleTable data={data} /></Provider>);
  return store;
}

it('sorts rolled initiative first, selects rows and renders the character combat summaries', () => {
  const waiting = { ...character('Czeka', null), powers: [], defenses: [], offenses: [] };
  const low = character('Iwo', 5);
  const high = character('Aldara', 14);
  const other = character('Nela', null);
  high.health = { ...high.health, vitality: 20, toughness: 2, barrier: 3, lethalHealth: 4, recoveryLevel: 2 };
  high.characteristics.constitution = { ...high.characteristics.constitution, value: 3, bonus: 1 };
  high.attributes.fortitude = { ...high.attributes.fortitude, value: 2 };
  high.characteristics.strength = { ...high.characteristics.strength, value: 10, testBonus: 2 };
  renderBattle([waiting, low, high, other]);

  const row = within(screen.getByRole('row', { name: 'Aldara' }));
  expect(row.getByText('29 +3')).toBeVisible();
  expect(row.getByText('(-4) [2]')).toBeVisible();
  expect(row.getByText('12')).toBeVisible();
  expect(row.getByText('straż')).toBeVisible();
  expect(row.getByText('Defense of Aldara')).toBeVisible();
  expect(row.getByText('Offense of Aldara')).toBeVisible();
  expect(row.getByText('Power of Aldara')).toBeVisible();
  expect(row.getAllByRole('link').map(link => link.getAttribute('href'))).toContain('/characters/Aldara?tab=combat');
  expect(within(screen.getByRole('row', { name: 'Czeka' })).queryByText(/Defense of|Offense of|Power of/)).not.toBeInTheDocument();

  fireEvent.click(row.getByRole('checkbox', { name: 'Select row' }));
  const all = screen.getByRole('checkbox', { name: 'Select all' });
  expect(all).toHaveAttribute('aria-checked', 'mixed');
  fireEvent.click(all);
  expect(screen.getAllByRole('checkbox', { name: 'Select row' }).every(box => box.getAttribute('aria-checked') === 'true')).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: displayedText.initiative }));
  const order = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  expect(order.map(item => item.getAttribute('aria-label'))).toEqual(['Aldara', 'Iwo', 'Czeka', 'Nela']);
});

it('validates manual initiative, records a roll and clears the active result', () => {
  const combatant = character('Aldara', null);
  const store = renderBattle([combatant]);
  const row = within(screen.getByRole('row', { name: 'Aldara' }));
  const manual = () => row.getByTitle(displayedText.manualInitiative);
  fireEvent.click(manual());
  const input = row.getByRole('spinbutton');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(row.getByRole('spinbutton')).toBeVisible();
  fireEvent.change(input, { target: { value: '7' } });
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(store.getState().bestiary.initiatives.Aldara).toBeUndefined();

  fireEvent.click(manual());
  const fresh = row.getByRole('spinbutton');
  expect(fresh).toHaveValue(null);
  fireEvent.change(fresh, { target: { value: '0' } });
  fireEvent.keyDown(fresh, { key: 'Enter' });
  expect(store.getState().bestiary.initiatives.Aldara).toEqual({ initiative: 0 });

  fireEvent.click(row.getByRole('button', { name: diceText.open + ': ' + displayedText.initiative }));
  expect(open).toHaveBeenCalledTimes(1);
  fireEvent.click(row.getByTitle(displayedText.rollInitiative));
  expect(rollInitiative).toHaveBeenCalledWith(combatant.attributes.initiative);
  expect(record).toHaveBeenCalledTimes(1);
  expect(store.getState().bestiary.initiatives.Aldara).toEqual({ initiative: 14 });

  const initiativeCell = row.getByTitle(displayedText.rollInitiative).closest('td')!;
  const clear = within(initiativeCell).getAllByRole('button', { name: '' }).find(button => !button.hasAttribute('title'))!;
  fireEvent.click(clear);
  expect(store.getState().bestiary.initiatives.Aldara).toBeUndefined();
});
