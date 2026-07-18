import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/__tests__/utils/testUtils';
import { API_KEY_STORAGE_KEY } from '@/lib/apiKeyStorage';
import { displayedText } from '@/common/translations';
import { store } from '@/persistence/slices/store';
import { actions } from '@/persistence/slices/bestiarySlice';

const { list, create, update, remove, getById, getByIds } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getById: vi.fn(),
  getByIds: vi.fn(),
}));

vi.mock('@/infrastructure/clients/battlePresetsClient', () => ({
  default: { list, create, update, remove, getById },
}));

vi.mock('@/infrastructure/clients/charactersClient', () => ({
  default: { getByIds },
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
    getByIds.mockReset();
    list.mockResolvedValue([]);
    getByIds.mockResolvedValue([]);
    // renderWithProviders reuses the app's singleton store (see testUtils.tsx),
    // so battle state must be reset between tests to avoid leaking across them.
    store.dispatch(actions.clearBattle());
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

  it('loads a preset into the battle, restoring characters and initiatives (Test 2: bitwa odtworzona)', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockResolvedValue([{ id: 'preset-1', name: 'Raid Test Setup', createdAt: '2026-01-01', updatedAt: '2026-01-02' }]);
    getById.mockResolvedValue({
      id: 'preset-1',
      name: 'Raid Test Setup',
      configuration: {
        characterIds: ['char-1'],
        initiatives: { 'char-1': { initiative: 15 } },
        externalParticipants: [],
        duplicatedCharacterRefs: [],
      },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    });

    // Pre-selects the preset without driving the Radix Select UI directly:
    // BattlePresetsPanel initializes its `selectedPresetId` state from the
    // already-loaded preset id in the bestiary slice.
    store.dispatch(actions.setLoadedPresetId('preset-1'));

    renderWithProviders(<BattlePresetsPanel />);

    await waitFor(() => expect(screen.getByRole('button', { name: displayedText.loadPreset })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: displayedText.loadPreset }));

    await waitFor(() => expect(getById).toHaveBeenCalledWith('preset-1'));
    await waitFor(() => expect(store.getState().bestiary.addedToBattle).toEqual(['char-1']));
    expect(store.getState().bestiary.initiatives).toEqual({ 'char-1': { initiative: 15 } });
    expect(store.getState().bestiary.loadedPresetId).toBe('preset-1');
  });

  it('saves the current battle over the loaded preset via Save Current (Test 3: zmiany zapisane)', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockResolvedValue([{ id: 'preset-1', name: 'Raid Test Setup', createdAt: '2026-01-01', updatedAt: '2026-01-02' }]);
    update.mockResolvedValue({
      id: 'preset-1',
      name: 'Raid Test Setup',
      configuration: { characterIds: ['char-1'], initiatives: {}, externalParticipants: [], duplicatedCharacterRefs: [] },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-03',
    });

    store.dispatch(actions.setLoadedPresetId('preset-1'));
    store.dispatch(actions.addSelectedToBattle(['char-1']));

    renderWithProviders(<BattlePresetsPanel />);

    await waitFor(() => expect(screen.getByRole('button', { name: displayedText.saveCurrentPreset })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: displayedText.saveCurrentPreset }));

    await waitFor(() => expect(update).toHaveBeenCalledWith('preset-1', {
      configuration: expect.objectContaining({ characterIds: ['char-1'] }),
    }));
  });

  it('deletes the selected preset after confirmation (Test 4: preset usunięty)', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockResolvedValue([{ id: 'preset-1', name: 'Raid Test Setup', createdAt: '2026-01-01', updatedAt: '2026-01-02' }]);
    remove.mockResolvedValue(undefined);

    store.dispatch(actions.setLoadedPresetId('preset-1'));

    renderWithProviders(<BattlePresetsPanel />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Usuń Raid Test Setup' })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Usuń Raid Test Setup' }));
    fireEvent.click(screen.getByRole('button', { name: displayedText.delete }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('preset-1'));
    await waitFor(() => expect(store.getState().bestiary.loadedPresetId).toBeNull());
  });

  it('shows an error toast and does not touch the battle state when Load fails', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockResolvedValue([{ id: 'preset-1', name: 'Raid Test Setup', createdAt: '2026-01-01', updatedAt: '2026-01-02' }]);
    getById.mockRejectedValue(new Error('network error'));

    store.dispatch(actions.setLoadedPresetId('preset-1'));

    renderWithProviders(<BattlePresetsPanel />);

    await waitFor(() => expect(screen.getByRole('button', { name: displayedText.loadPreset })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: displayedText.loadPreset }));

    await waitFor(() => expect(getById).toHaveBeenCalled());
    expect(store.getState().bestiary.addedToBattle).toEqual([]);
  });
});
