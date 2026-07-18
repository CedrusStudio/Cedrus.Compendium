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

vi.mock('@/infrastructure/clients/charactersClient', () => ({
  default: { getByIds: vi.fn().mockResolvedValue([]) },
}));

import BattlePresetsPanel from '@/application/battlePresets/components/BattlePresetsPanel';

describe('BattlePresetsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    list.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getById.mockReset();
    list.mockResolvedValue([]);
  });

  it('shows a message and no controls when there is no API key set', () => {
    renderWithProviders(<BattlePresetsPanel />);

    expect(screen.getByText(displayedText.battlePresetsRequireApiKey)).toBeTruthy();
    expect(screen.queryByText(displayedText.loadPreset)).toBeNull();
  });

  it('disables Load and Save Current until a preset is selected/loaded', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockResolvedValue([{ id: 'preset-1', name: 'Raid Test Setup', createdAt: '2026-01-01', updatedAt: '2026-01-02' }]);

    renderWithProviders(<BattlePresetsPanel />);

    await waitFor(() => expect(screen.getByText(displayedText.loadPreset)).toBeTruthy());

    expect(screen.getByRole('button', { name: displayedText.loadPreset })).toBeDisabled();
    expect(screen.getByRole('button', { name: displayedText.saveCurrentPreset })).toBeDisabled();
  });

  it('creates a new preset via Save As (Test 1: preset zapisany)', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    create.mockResolvedValue({ id: 'preset-new' });

    renderWithProviders(<BattlePresetsPanel />);

    await waitFor(() => expect(screen.getByText(displayedText.noBattlePresetsSaved)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: displayedText.saveAsNewPreset }));
    fireEvent.change(screen.getByLabelText(displayedText.battlePresetName), { target: { value: 'Boss Fight v2' } });
    fireEvent.click(screen.getByRole('button', { name: displayedText.save }));

    await waitFor(() => expect(create).toHaveBeenCalledWith('Boss Fight v2', expect.objectContaining({ characterIds: [] })));
  });
});
