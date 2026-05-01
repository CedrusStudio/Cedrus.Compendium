import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
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

import FavoriteCharacterButton from '@/application/personalization/FavoriteCharacterButton';
import { createEmptyProfile, reducer as personalizationReducer } from '@/persistence/slices/personalizationSlice';

describe('FavoriteCharacterButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles a character as favorite through the Redux personalization slice', () => {
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
        <FavoriteCharacterButton characterId="character-1" />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add favorite character' }));

    expect(store.getState().personalization.profilesByApiKey.alpha.favoriteCharacterIds).toEqual(['character-1']);

    fireEvent.click(screen.getByRole('button', { name: 'Remove favorite character' }));

    expect(store.getState().personalization.profilesByApiKey.alpha.favoriteCharacterIds).toEqual([]);
  });
});