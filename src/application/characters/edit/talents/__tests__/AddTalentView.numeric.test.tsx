import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { displayedText } from '@/common/translations';
import { defaultTalent } from '@/domain/characters/Talent';

vi.mock('@/common/components/inputs/LabeledFormSelectInput', () => ({
  default: ({ name, value, onChange, collectionToSelectFrom }: {
    name: string; value: string; onChange: (value: string) => void; collectionToSelectFrom: string[];
  }) => <select aria-label={name} value={value} onChange={e => onChange(e.target.value)}>
    <option value="">Choose</option>
    {collectionToSelectFrom.map(option => <option key={option} value={option}>{option}</option>)}
  </select>,
}));

import AddTalentView from '../AddTalentView';

describe('required numeric values in new talents', () => {
  it.each(['grade', 'bonus'])('does not add a talent with a cleared %s', field => {
    const append = vi.fn();
    const { container } = render(<AddTalentView append={append} setNameFilter={vi.fn()} />);
    fireEvent.click(container.querySelector('[data-slot="sheet-trigger"]')!);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(displayedText.name), { target: { value: 'Nowa umiejętność' } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'category' }), { target: { value: 'wiedza' } });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'characteristics' }), { target: { value: 'umysł' } });
    const input = dialog.querySelector(`input[name="${field}"]`)!;
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    fireEvent.click(within(dialog).getByRole('button', { name: displayedText.addTalent }));
    expect(append).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Uzupełnij pole')).toBeVisible();
    expect((input as HTMLInputElement).value).toBe('');
    fireEvent.change(input, { target: { value: field === 'bonus' ? '0' : '5' } });
    fireEvent.click(within(dialog).getByRole('button', { name: displayedText.addTalent }));
    expect(append).toHaveBeenCalledOnce();
    expect(append.mock.calls[0][0]).toMatchObject({ bonus: 0, grade: field === 'grade' ? 5 : defaultTalent.grade });
  });
});
