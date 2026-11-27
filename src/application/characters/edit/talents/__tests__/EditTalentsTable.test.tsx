import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { basicTalents, defaultTalent, type Talent } from '@/domain/characters/Talent';
import type { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { defaultColumns } from '@/application/characters/talents/defaultColumns';
import { TalentsTable } from '@/application/characters/talents/TalentsTable';
import { columns as characterColumns } from '@/application/characters/talents/talentsColumns';
import DiceRollerProvider from '@/application/dice-roller/DiceRollerProvider';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';
import { displayedText } from '@/common/translations';

// The default setup returns the same ID for every talent in the basic collection.
vi.unmock('ulid');

// Native selects keep this test focused on the real form, addition and table
// scrolling, without relying on browser pointer APIs for Radix popovers.
vi.mock('@/common/components/inputs/LabeledFormSelectInput', () => ({
  default: ({ name, value, onChange, collectionToSelectFrom }: {
    name: string; value: string; onChange: (value: string) => void; collectionToSelectFrom: string[];
  }) => (
    <select aria-label={name} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Choose</option>
      {collectionToSelectFrom.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  ),
}));

import { EditTalentsTable } from '@/application/characters/edit/talents/EditTalentsTable';

const talents: Talent[] = Array.from({ length: 25 }, (_, index) => ({
  ...defaultTalent, id: `talent-${index}`, name: `Existing skill ${index + 1}`, category: index === 24 ? 'fach' : 'wiedza',
}));

function TalentEditor({ readDraft, initial = talents }: { readDraft?: (draft: Talent[]) => void; initial?: Talent[] } = {}) {
  const form = useForm<TalentsDto>({ defaultValues: { talents: initial } });
  return (
    <FormProvider {...form}>
      <EditTalentsTable columns={defaultColumns} initialTalents={initial} />
      {readDraft && <button type="button" onClick={() => readDraft(form.getValues('talents'))}>Read draft</button>}
    </FormProvider>
  );
}

function mockScroll() {
  let notify: (isIntersecting: boolean) => void;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
      notify = isIntersecting => callback([{ isIntersecting }]);
    }
    observe() {}
    disconnect() {}
  });
  return () => notify;
}

function toolbar() {
  return within(screen.getByRole('group', { name: 'Narzędzia talentów' }));
}

afterEach(() => vi.unstubAllGlobals());

describe.each(['view', 'edit'])('talent browsing in %s', mode => {
  it('appends rows on scroll, keeps the existing rows and resets the batch on filtering', () => {
    const lastObserver = mockScroll();
    render(mode === 'edit' ? <TalentEditor /> : <TalentsTable columns={defaultColumns} data={talents} />);
    const names = () => within(screen.getByRole('table')).getAllByText(/^Existing skill /).map(cell => cell.textContent);
    const expected = (start: number, end: number) => talents.slice(start, end).map(talent => talent.name);
    expect(screen.queryByRole('navigation', { name: 'Strony talentów' })).not.toBeInTheDocument();
    expect(names()).toEqual(expected(0, 10));
    const firstObserver = lastObserver();
    act(() => firstObserver(false));
    expect(names()).toEqual(expected(0, 10));
    act(() => firstObserver(true));
    expect(names()).toEqual(expected(0, 20));
    act(() => firstObserver(true));
    expect(names()).toEqual(expected(0, 20));
    act(() => lastObserver()(true));
    expect(names()).toEqual(expected(0, 25));

    const search = screen.getByPlaceholderText(displayedText.searchByName);
    fireEvent.change(search, { target: { value: 'Existing skill 2' } });
    expect(names()).toEqual(talents.filter(talent => talent.name.includes('skill 2')).map(talent => talent.name));
    fireEvent.change(search, { target: { value: '' } });
    expect(names()).toEqual(expected(0, 10));

    act(() => lastObserver()(true));
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('option', { name: 'fach' }));
    expect(names()).toEqual(expected(24, 25));
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('option', { name: displayedText.all }));
    expect(names()).toEqual(expected(0, 10));
  });
});

describe('EditTalentsTable after adding a talent', () => {
  it.each([1, 3])('shows the new talent after browsing %i batches', batch => {
    const lastObserver = mockScroll();
    render(<TalentEditor />);
    for (let index = 1; index < batch; index++) {
      act(() => lastObserver()(true));
    }

    expect(screen.getByText(`Existing skill ${(batch - 1) * 10 + 1}`)).toBeVisible();

    if (batch === 1) {
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
      fireEvent.click(screen.getByRole('option', { name: 'fach' }));
    }
    fireEvent.click(toolbar().getByRole('button', { name: displayedText.addNewTalent }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(displayedText.name), { target: { value: 'Newly added skill' } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'category' }), { target: { value: 'wiedza' } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'characteristics' }), { target: { value: 'umysł' } });
    fireEvent.click(within(dialog).getByRole('button', { name: displayedText.addTalent }));

    expect(screen.getByPlaceholderText(displayedText.searchByName)).toHaveValue('Newly added skill');
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Newly added skill')).toBeVisible();
    expect(table.queryByText('Existing skill 21')).not.toBeInTheDocument();
  });
});

it('sorts using the keyboard and updates the original form rows after scrolling and filtering', async () => {
  const user = userEvent.setup();
  const readDraft = vi.fn();
  const lastObserver = mockScroll();
  render(<TalentEditor readDraft={readDraft} />);
  act(() => lastObserver()(true));
  expect(screen.getByText('Existing skill 11')).toBeVisible();
  fireEvent.keyDown(toolbar().getByRole('button', { name: displayedText.columns }), { key: 'Enter' });
  await user.click(screen.getByRole('menuitemcheckbox', { name: displayedText.category }));
  const table = screen.getByRole('table');
  const sortCategory = within(table.querySelector('thead')!).getByRole('button', { name: displayedText.category });
  sortCategory.focus();
  await user.keyboard('{Enter}');
  expect(table.querySelector('tbody td')).toHaveTextContent('Existing skill 25');
  expect(within(table).queryByText('Existing skill 11')).not.toBeInTheDocument();

  act(() => lastObserver()(true));
  act(() => lastObserver()(true));
  const skill21 = screen.getByText('Existing skill 21').closest('tr')!;
  // Name, category, grade, bonus and the remove action are visible.
  fireEvent.click(within(skill21.cells[2]).getAllByRole('button')[0]);
  fireEvent.change(screen.getByPlaceholderText(displayedText.searchByName), { target: { value: 'Existing skill 2' } });
  const skill24 = screen.getByText('Existing skill 24').closest('tr')!;
  fireEvent.click(within(skill24.cells[skill24.cells.length - 1]).getByRole('button'));
  fireEvent.click(screen.getByText('Read draft'));
  const expectedDraft = talents.filter(talent => talent.name !== 'Existing skill 24')
    .map(talent => talent.name === 'Existing skill 21' ? { ...talent, grade: talent.grade + 1 } : talent);
  expect(readDraft).toHaveBeenCalledWith(expectedDraft.map(talent => expect.objectContaining(talent)));
});

it('adds only missing basic talents and preserves the character’s existing grades on repeated additions', () => {
  const learned = { ...basicTalents[0], id: 'learned', grade: 7 };
  const custom = talents[0];
  const readDraft = vi.fn();
  render(<TalentEditor initial={[custom, learned]} readDraft={readDraft} />);
  const addBasic = toolbar().getByRole('button', { name: 'Dodaj podstawowe talenty' });
  const expected = [custom, learned, ...basicTalents.slice(1)];
  for (let attempt = 0; attempt < 2; attempt++) {
    fireEvent.click(addBasic);
    fireEvent.click(screen.getByText('Read draft'));
    expect(readDraft).toHaveBeenLastCalledWith(expected);
  }
});

it('keeps the draft after cancelling bulk removal and shows an empty table after confirmation', async () => {
  const readDraft = vi.fn();
  render(<TalentEditor initial={talents.slice(0, 2)} readDraft={readDraft} />);
  const removeAll = toolbar().getByRole('button', { name: 'Usuń wszystkie talenty' });
  fireEvent.click(removeAll);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: displayedText.cancel }));
  fireEvent.click(screen.getByText('Read draft'));
  expect(readDraft).toHaveBeenLastCalledWith(talents.slice(0, 2));

  fireEvent.click(removeAll);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usuń wszystkie talenty' }));
  await userEvent.setup().keyboard('{Escape}');
  expect(within(screen.getByRole('table')).getByText('Brak wyników')).toBeVisible();
  fireEvent.click(screen.getByText('Read draft'));
  expect(readDraft).toHaveBeenLastCalledWith([]);
});

it('shows every row without IntersectionObserver and preserves columns across filters', async () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  render(<TalentsTable columns={defaultColumns} data={talents} />);
  expect(within(screen.getByRole('table')).getAllByText(/^Existing skill /)).toHaveLength(25);
  const user = userEvent.setup();
  const table = screen.getByRole('table');
  const heading = within(table.querySelector('thead')!);
  const toggleCategory = async () => {
    fireEvent.keyDown(toolbar().getByRole('button', { name: displayedText.columns }), { key: 'Enter' });
    await user.click(screen.getByRole('menuitemcheckbox', { name: displayedText.category }));
  };
  expect(heading.queryByRole('columnheader', { name: displayedText.category })).toBeNull();
  await toggleCategory();
  expect(heading.getByRole('columnheader', { name: displayedText.category })).toBeVisible();
  const search = toolbar().getByPlaceholderText(displayedText.searchByName);
  fireEvent.change(search, { target: { value: 'absent talent' } });
  expect(within(table).getByText('Brak wyników')).toBeVisible();
  fireEvent.change(search, { target: { value: 'Existing skill 25' } });
  expect(within(table).getByText('fach')).toBeVisible();
  await toggleCategory();
  expect(within(table).queryByText('fach')).toBeNull();
  expect(within(table).getByText('Existing skill 25')).toBeVisible();
});

it('rolls with the visible talent bonus, records it and opens the same dice preset', () => {
  const talent = { ...talents[0], grade: 3, bonus: -1 };
  render(<DiceRollerProvider><TalentsTable columns={characterColumns} data={[talent]} /></DiceRollerProvider>);
  const row = screen.getByText(talent.name).closest('tr')!;
  const rollCell = within(row.cells[row.cells.length - 1]);
  const [increase, , reset] = rollCell.getAllByRole('button');
  fireEvent.click(increase);
  expect(rollCell.getByText('+0')).toBeVisible();
  fireEvent.click(reset);
  fireEvent.click(reset);
  expect(rollCell.getByText('-1')).toBeVisible();
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
  try {
    const roll = rollCell.getByRole('button', { name: displayedText.roll });
    fireEvent.click(roll);
    expect(roll).toHaveTextContent('3');
    fireEvent.click(rollCell.getByRole('button', { name: `${diceText.open}: ${talent.name}` }));
    expect(screen.getByLabelText(diceText.modifier)).toHaveValue(-1);
    expect(screen.getByRole('listitem')).toHaveTextContent(talent.name);
    expect(screen.getByRole('listitem').querySelector('strong')).toHaveTextContent('3');
  } finally {
    random.mockRestore();
  }
});
