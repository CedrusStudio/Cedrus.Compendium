import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';
import { displayedText } from '@/common/translations';

const usePersonalizationMock = vi.fn();
const useFavoriteCharactersMock = vi.fn();

vi.mock('@/common/hooks/usePersonalization', () => ({
  usePersonalization: () => usePersonalizationMock(),
}));

vi.mock('@/application/personalization/useFavoriteCharacters', () => ({
  useFavoriteCharacters: () => useFavoriteCharactersMock(),
}));

vi.mock('@/common/components/ApiKeySettings', () => ({
  ApiKeySettings: () => <div>api key settings</div>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { createEmptyProfile } from '@/persistence/slices/personalizationSlice';
import PersonalizationPage from '@/app/personalization/page';

describe('PersonalizationPage', () => {
  beforeEach(() => {
    useFavoriteCharactersMock.mockReset();
    usePersonalizationMock.mockReset();
  });

  it('renders the stored profile user name and saves a new one', () => {
    const setUserName = vi.fn();
    const updateQuickLink = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        userName: 'Marek',
      },
      setUserName,
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink,
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    expect(screen.getByText('Marek')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Zarzadzaj tagami' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Wroc do strony glownej' }).getAttribute('href')).toBe('/');

    fireEvent.change(screen.getByPlaceholderText('Nazwa użytkownika dla tego API key'), { target: { value: 'Anna' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz nazwę' }));

    expect(setUserName).toHaveBeenCalledWith('Anna');
  });

  it('clears the profile user name', () => {
    const setUserName = vi.fn();
    const updateQuickLink = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        userName: 'Marek',
      },
      setUserName,
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink,
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Wyczyść nazwę' }));

    expect(setUserName).toHaveBeenCalledWith(undefined);
  });

  it('saves and clears a bestiary column preference', () => {
    const setBestiaryColumnVisibility = vi.fn();
    const clearBestiaryColumnVisibility = vi.fn();
    const updateQuickLink = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        bestiaryColumnVisibility: defaultBestiaryColumnVisibility,
      },
      setUserName: vi.fn(),
      setBestiaryColumnVisibility,
      clearBestiaryColumnVisibility,
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink,
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    fireEvent.click(screen.getByLabelText(displayedText.powers));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz kolumny bestiariusza' }));

    expect(setBestiaryColumnVisibility).toHaveBeenCalledWith({
      ...defaultBestiaryColumnVisibility,
      powers: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Przywróć domyślne kolumny' }));

    expect(clearBestiaryColumnVisibility).toHaveBeenCalled();
  });

  it('edits a saved route quick link with the shared action controls', () => {
    const updateQuickLink = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        quickLinks: [
          {
            id: 'compendium',
            label: 'Kompendium',
            type: 'route',
            href: '/compendium',
          },
        ],
      },
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink,
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj link Kompendium' }));
    fireEvent.change(screen.getByDisplayValue('Kompendium'), { target: { value: 'Moje kompendium' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(updateQuickLink).toHaveBeenCalledWith({
      id: 'compendium',
      label: 'Moje kompendium',
      type: 'route',
      href: '/compendium',
    });
  });

  it('renders per-character navigation in the favorites section and removes the redundant overview button', () => {
    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        favoriteCharacterIds: ['character-1'],
      },
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({
      favoriteCharacters: [{ id: 'character-1', name: 'Geralt', shortName: 'Ger' }],
      isLoading: false,
    });

    render(<PersonalizationPage />);

    expect(screen.queryByRole('link', { name: 'Otworz ulubione' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Przejdz do postaci Geralt' })).toHaveAttribute('href', '/characters/character-1');
  });

  it('allows selecting the main character directly from the favorites rows', () => {
    const setMainCharacter = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        favoriteCharacterIds: ['character-1'],
      },
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      addFavoriteCharacter: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter,
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({
      favoriteCharacters: [{ id: 'character-1', name: 'Geralt', shortName: 'Ger' }],
      isLoading: false,
    });

    render(<PersonalizationPage />);

    expect(screen.queryByText('Główna postać')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Set main character' }));

    expect(setMainCharacter).toHaveBeenCalledWith('character-1');
  });
});