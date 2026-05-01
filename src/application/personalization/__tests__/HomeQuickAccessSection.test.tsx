import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useApiKeyMock = vi.fn();

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => useApiKeyMock(),
  getStoredApiKey: () => 'alpha',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import HomeQuickAccessSection from '@/application/personalization/HomeQuickAccessSection';
import { createEmptyProfile, reducer as personalizationReducer } from '@/persistence/slices/personalizationSlice';

describe('HomeQuickAccessSection', () => {
  beforeEach(() => {
    localStorage.clear();
    useApiKeyMock.mockReset();
  });

  it('shows an actionable empty state when no API key is set', () => {
    useApiKeyMock.mockReturnValue({
      apiKey: null,
      hasApiKey: false,
      isLoaded: true,
      saveApiKey: vi.fn(),
      removeApiKey: vi.fn(),
    });

    const store = configureStore({ reducer: { personalization: personalizationReducer } });

    render(
      <Provider store={store}>
        <HomeQuickAccessSection />
      </Provider>,
    );

    expect(screen.getByText('Ustaw API key, aby wlaczyc personalizacje.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Przejdz do personalizacji' })).toHaveAttribute('href', '/personalization');
  });

  it('renders the main character and configured quick links for the active profile', () => {
    useApiKeyMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      saveApiKey: vi.fn(),
      removeApiKey: vi.fn(),
    });

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
              favoriteCharacterIds: ['character-1'],
              mainCharacterId: 'character-1',
              quickLinks: [
                {
                  id: 'compendium',
                  label: 'Kompendium',
                  type: 'route',
                  href: '/compendium',
                },
              ],
            },
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <HomeQuickAccessSection />
      </Provider>,
    );

    expect(screen.getByRole('link', { name: /Główna postać/i })).toHaveAttribute('href', '/characters/character-1');
    expect(screen.getByRole('link', { name: /Kompendium/ })).toHaveAttribute('href', '/compendium');
  });
});