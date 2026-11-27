import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PersonalizationProvider } from '@/infrastructure/providers/PersonalizationProvider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => ({
    apiKey: 'alpha',
    hasApiKey: true,
    isLoaded: true,
    saveApiKey: vi.fn(),
    removeApiKey: vi.fn(),
  }),
  getStoredApiKey: () => 'alpha',
}));

import MainCharacterButton from '@/application/personalization/MainCharacterButton';
import { createEmptyProfile, reducer as personalizationReducer } from '@/persistence/slices/personalizationSlice';

describe('MainCharacterButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles a character as the main character through the Redux personalization slice', () => {
    const store = configureStore({
      reducer: {
        personalization: personalizationReducer,
      },
      preloadedState: {
        personalization: {
          activeApiKey: 'alpha',
          profilesByApiKey: {
            alpha: createEmptyProfile(),
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <PersonalizationProvider>
          <MainCharacterButton characterId="character-1" />
        </PersonalizationProvider>
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Set main character' }));

    expect(store.getState().personalization.profilesByApiKey.alpha.mainCharacterId).toBe('character-1');
    expect(store.getState().personalization.profilesByApiKey.alpha.favoriteCharacterIds).toEqual(['character-1']);

    fireEvent.click(screen.getByRole('button', { name: 'Unset main character' }));

    expect(store.getState().personalization.profilesByApiKey.alpha.mainCharacterId).toBeUndefined();
    expect(store.getState().personalization.profilesByApiKey.alpha.favoriteCharacterIds).toEqual(['character-1']);
  });
});