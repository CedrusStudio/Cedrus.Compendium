import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { RequirementSearchFilter } from '@/common/global/SearchPayloads';
import RequirementFilter from '../RequirementFilter';

it('keeps the numeric zero, ignores case-equivalent duplicates and removes only the chosen condition', async () => {
  const changed = vi.fn<(filters: RequirementSearchFilter[]) => void>();

  function Filters()
  {
    const [filters, setFilters] = useState<RequirementSearchFilter[]>([]);
    return <RequirementFilter value={filters} onChange={next => {
      changed(next);
      setFilters(next);
    }} />;
  }

  render(<Filters />);
  fireEvent.click(screen.getByRole('button', { name: 'Wymagania' }));
  const panel = within(screen.getByRole('dialog'));
  const add = panel.getByRole('button', { name: 'Dodaj' });
  expect(add).toBeDisabled();

  const value = panel.getByRole('spinbutton');
  fireEvent.change(value, { target: { value: '0' } });
  fireEvent.keyDown(value, { key: 'Enter' });
  const ranked = { kind: 'ranked', group: 'characteristics', targetKey: 'strength', maxValue: 0 };
  expect(changed).toHaveBeenLastCalledWith([ranked]);

  fireEvent.keyDown(panel.getAllByRole('combobox')[0], { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Dowolny tekst' }));
  const text = panel.getByPlaceholderText('np. Lekka zbroja');
  fireEvent.change(text, { target: { value: '  Lekka zbroja  ' } });
  fireEvent.click(add);
  expect(changed).toHaveBeenLastCalledWith([ranked, { kind: 'text', text: 'Lekka zbroja' }]);
  fireEvent.change(text, { target: { value: 'lekka zbroja' } });
  fireEvent.click(add);
  expect(changed).toHaveBeenCalledTimes(2);

  fireEvent.click(panel.getByRole('button', { name: /Usuń filtr .*Lekka zbroja/ }));
  expect(changed).toHaveBeenLastCalledWith([ranked]);
  fireEvent.click(panel.getByRole('button', { name: 'Wyczyść' }));
  expect(changed).toHaveBeenLastCalledWith([]);
  expect(screen.getByRole('button', { name: 'Wymagania' })).toHaveAttribute('aria-expanded', 'false');
});
