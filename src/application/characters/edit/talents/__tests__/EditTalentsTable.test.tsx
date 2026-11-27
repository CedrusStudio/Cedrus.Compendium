import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { Table } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';
import { defaultTalent, type Talent } from '@/domain/characters/Talent';
import type { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { defaultColumns } from '@/application/characters/talents/defaultColumns';
import { displayedText } from '@/common/translations';

vi.mock('@/common/components/table/PaginationButtons', () => ({
  default: ({ table }: { table: Table<Talent> }) => (
    <nav aria-label="Talent pagination">
      <span>Page {table.getState().pagination.pageIndex + 1}</span>
      <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next page</button>
      <button type="button" disabled={!table.getCanPreviousPage()}>Previous page</button>
    </nav>
  ),
}));

// Native selects keep this test focused on the real form, addition and table
// pagination, without relying on browser pointer APIs for Radix popovers.
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
  ...defaultTalent, id: `talent-${index}`, name: `Existing skill ${index + 1}`, category: 'wiedza',
}));

function TalentEditor() {
  const form = useForm<TalentsDto>({ defaultValues: { talents } });
  return (
    <FormProvider {...form}>
      <EditTalentsTable columns={defaultColumns} initialTalents={talents} isPending={false} />
    </FormProvider>
  );
}

describe('EditTalentsTable pagination after adding a talent', () => {
  it.each([1, 3])('shows the new talent on page one when added from page %i', page => {
    const { container } = render(<TalentEditor />);
    const pagination = within(screen.getByRole('navigation', { name: 'Talent pagination' }));
    for (let index = 1; index < page; index++) {
      fireEvent.click(pagination.getByRole('button', { name: 'Next page' }));
    }

    expect(pagination.getByText(`Page ${page}`)).toBeInTheDocument();
    if (page === 3) expect(screen.getByText('Existing skill 21')).toBeVisible();

    fireEvent.click(container.querySelector('[data-slot="sheet-trigger"]')!);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(displayedText.name), { target: { value: 'Newly added skill' } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'category' }), { target: { value: 'wiedza' } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'characteristics' }), { target: { value: 'umysł' } });
    fireEvent.click(within(dialog).getByRole('button', { name: displayedText.addTalent }));

    expect(screen.getByPlaceholderText(displayedText.searchByName)).toHaveValue('Newly added skill');
    expect(pagination.getByText('Page 1')).toBeInTheDocument();
    expect(pagination.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(pagination.getByRole('button', { name: 'Next page' })).toBeDisabled();
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Newly added skill')).toBeVisible();
    expect(table.queryByText('Existing skill 21')).not.toBeInTheDocument();
  });
});
