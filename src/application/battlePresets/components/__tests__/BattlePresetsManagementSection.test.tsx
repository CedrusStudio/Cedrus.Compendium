import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/__tests__/utils/testUtils';
import { API_KEY_STORAGE_KEY } from '@/lib/apiKeyStorage';
import { displayedText } from '@/common/translations';

const { list, create, update, remove, getById } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getById: vi.fn(),
}));

vi.mock('@/infrastructure/clients/battlePresetsClient', () => ({
  default: { list, create, update, remove, getById },
}));

import BattlePresetsManagementSection from '@/application/battlePresets/components/BattlePresetsManagementSection';

describe('BattlePresetsManagementSection', () => {
  beforeEach(() => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getById.mockReset();
  });

  it('renders the saved presets by name', async () => {
    list.mockResolvedValue([
      { id: 'preset-1', name: 'Boss Fight Setup', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'preset-2', name: 'PvP Setup', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]);

    renderWithProviders(<BattlePresetsManagementSection />);

    expect(await screen.findByText('Boss Fight Setup')).toBeTruthy();
    expect(screen.getByText('PvP Setup')).toBeTruthy();
  });

  it('renames a preset (Test 3: zmiany zapisane)', async () => {
    list.mockResolvedValue([{ id: 'preset-1', name: 'Boss Fight Setup', createdAt: '2026-01-01', updatedAt: '2026-01-01' }]);
    update.mockResolvedValue({ id: 'preset-1', name: 'Boss Fight v2', configuration: {}, createdAt: '2026-01-01', updatedAt: '2026-01-02' });

    renderWithProviders(<BattlePresetsManagementSection />);

    expect(await screen.findByText('Boss Fight Setup')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj Boss Fight Setup' }));
    const input = screen.getByDisplayValue('Boss Fight Setup');
    fireEvent.change(input, { target: { value: 'Boss Fight v2' } });
    fireEvent.click(screen.getByRole('button', { name: displayedText.save }));

    await waitFor(() => expect(update).toHaveBeenCalledWith('preset-1', { name: 'Boss Fight v2' }));
  });

  it('deletes a preset after confirmation (Test 4: preset usunięty)', async () => {
    list.mockResolvedValue([{ id: 'preset-1', name: 'Boss Fight Setup', createdAt: '2026-01-01', updatedAt: '2026-01-01' }]);
    remove.mockResolvedValue(undefined);

    renderWithProviders(<BattlePresetsManagementSection />);

    expect(await screen.findByText('Boss Fight Setup')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usun Boss Fight Setup' }));
    fireEvent.click(screen.getByRole('button', { name: displayedText.delete }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('preset-1'));
  });

  it('shows a placeholder message when there are no saved presets', async () => {
    list.mockResolvedValue([]);

    renderWithProviders(<BattlePresetsManagementSection />);

    expect(await screen.findByText(displayedText.noBattlePresetsSaved)).toBeTruthy();
  });
});
