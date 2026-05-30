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

import PersonalizedQuickTags from '@/application/personalization/PersonalizedQuickTags';
import { createEmptyProfile, reducer as personalizationReducer } from '@/persistence/slices/personalizationSlice';

describe('PersonalizedQuickTags', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('injects a saved quick tag into the current filter state', () => {
    const store = configureStore({
      reducer: {
        personalization: personalizationReducer,
      },
      preloadedState: {
        personalization: {
          activeApiKey: 'alpha',
          profilesByApiKey: {
            alpha: {
              ...createEmptyProfile(),
              quickTagsByContext: {
                perks: ['alchemy'],
              },
            },
          },
        },
      },
    });

    const onSelectedTagsChange = vi.fn();

    render(
      <Provider store={store}>
        <PersonalizedQuickTags context="perks" selectedTags={[]} onSelectedTagsChange={onSelectedTagsChange} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'alchemy' }));

    expect(onSelectedTagsChange).toHaveBeenCalledWith(['alchemy']);
  });

  it('injects a saved exclude quick tag into the current exclude filter state', () => {
    const store = configureStore({
      reducer: {
        personalization: personalizationReducer,
      },
      preloadedState: {
        personalization: {
          activeApiKey: 'alpha',
          profilesByApiKey: {
            alpha: {
              ...createEmptyProfile(),
              quickExcludeTagsByContext: {
                perks: ['cursed'],
              },
            },
          },
        },
      },
    });

    const onSelectedTagsChange = vi.fn();

    render(
      <Provider store={store}>
        <PersonalizedQuickTags context="perks" mode="exclude" selectedTags={[]} onSelectedTagsChange={onSelectedTagsChange} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'cursed' }));

    expect(onSelectedTagsChange).toHaveBeenCalledWith(['cursed']);
  });
});