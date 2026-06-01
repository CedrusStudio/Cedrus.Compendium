import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';
import { displayedText } from '@/common/translations';

const sonnerMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {};
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

const usePersonalizationMock = vi.fn();
const useFavoriteCharactersMock = vi.fn();
const useEntityTagsMock = vi.fn();

vi.mock('@/common/hooks/usePersonalization', () => ({
  usePersonalization: () => usePersonalizationMock(),
}));

vi.mock('@/application/personalization/useFavoriteCharacters', () => ({
  useFavoriteCharacters: () => useFavoriteCharactersMock(),
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: (entity: string) => useEntityTagsMock(entity),
}));

vi.mock('@/common/components/ApiKeySettings', () => ({
  ApiKeySettings: () => <div>api key settings</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: sonnerMocks.success,
    error: sonnerMocks.error,
  },
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
    useEntityTagsMock.mockReset();
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false, error: null });
    sonnerMocks.success.mockReset();
    sonnerMocks.error.mockReset();
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

  it('renders an explicit save-to-database button and calls the hook action', async () => {
    const saveToDatabase = vi.fn().mockResolvedValue(createEmptyProfile());

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      isSavingToDatabase: false,
      profile: createEmptyProfile(),
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
      saveToDatabase,
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Save to database' }));

    await waitFor(() => expect(saveToDatabase).toHaveBeenCalledTimes(1));
    expect(sonnerMocks.success).toHaveBeenCalledWith('Zapisano konfiguracje aktywnego profilu w bazie danych.');
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

  it('shows the extended compendium routes in the quick link selector', async () => {
    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: createEmptyProfile(),
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      addFavoriteCharacter: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    const quickLinkRouteSelect = document.getElementById('quick-link-route-select');

    expect(quickLinkRouteSelect).not.toBeNull();

    fireEvent.click(quickLinkRouteSelect!);

    expect(await screen.findByText('Ekwipunek')).toBeTruthy();
    expect(await screen.findByText('Bronie')).toBeTruthy();
    expect(await screen.findByText('Lista postaci')).toBeTruthy();
  });

  it('adds a quick tag from the existing tags selector', async () => {
    const addQuickTag = vi.fn();

    useEntityTagsMock.mockImplementation((entity: string) => ({
      tags: entity === 'characters' ? ['alchemy', 'witcher'] : [],
      isLoading: false,
      error: null,
    }));

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: createEmptyProfile(),
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag,
      removeQuickTag: vi.fn(),
      addFavoriteCharacter: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    const existingTagSelect = document.getElementById('personalization-existing-tag-select');

    expect(existingTagSelect).not.toBeNull();

    fireEvent.click(existingTagSelect!);
    fireEvent.click(await screen.findByText('alchemy'));

    expect(addQuickTag).toHaveBeenCalledWith('characters', 'alchemy');
  });

  it('adds an exclude quick tag from the existing tags selector', async () => {
    const addQuickExcludeTag = vi.fn();

    useEntityTagsMock.mockImplementation((entity: string) => ({
      tags: entity === 'characters' ? ['alchemy', 'cursed'] : [],
      isLoading: false,
      error: null,
    }));

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: createEmptyProfile(),
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      addQuickExcludeTag,
      removeQuickTag: vi.fn(),
      removeQuickExcludeTag: vi.fn(),
      addFavoriteCharacter: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    const tagModeSelect = document.getElementById('personalization-tag-mode-select');
    expect(tagModeSelect).not.toBeNull();

    fireEvent.click(tagModeSelect!);
    fireEvent.click(await screen.findByRole('option', { name: 'Wykluczające' }));

    const existingTagSelect = document.getElementById('personalization-existing-tag-select');
    expect(existingTagSelect).not.toBeNull();

    fireEvent.click(existingTagSelect!);
    fireEvent.click(await screen.findByText('cursed'));

    expect(addQuickExcludeTag).toHaveBeenCalledWith('characters', 'cursed');
  });

  it('exports the active profile as a JSON file', () => {
    const createObjectURL = vi.fn(() => 'blob:personalization');
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURL,
    });

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        userName: 'Marek',
      },
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      addFavoriteCharacter: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Eksportuj konfiguracje JSON' }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:personalization');
    expect(sonnerMocks.success).toHaveBeenCalledWith('Wyeksportowano konfiguracje aktywnego profilu do pliku JSON.');

    clickSpy.mockRestore();
  });

  it('imports a JSON configuration into the active profile', async () => {
    const replaceProfile = vi.fn();
    const fileContents = JSON.stringify({
      format: 'cedrus-personalization-profile',
      version: 1,
      profile: {
        userName: 'Anna',
        favoriteCharacterIds: ['character-1'],
        mainCharacterId: 'character-1',
      },
    });

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: createEmptyProfile(),
      setUserName: vi.fn(),
      setBestiaryColumnVisibility: vi.fn(),
      clearBestiaryColumnVisibility: vi.fn(),
      addQuickTag: vi.fn(),
      removeQuickTag: vi.fn(),
      addFavoriteCharacter: vi.fn(),
      removeFavoriteCharacter: vi.fn(),
      setMainCharacter: vi.fn(),
      addQuickLink: vi.fn(),
      removeQuickLink: vi.fn(),
      updateQuickLink: vi.fn(),
      replaceProfile,
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    const importInput = screen.getByLabelText('Importuj konfiguracje JSON');
    const file = new File([fileContents], 'profile.json', { type: 'application/json' });

    Object.defineProperty(file, 'text', {
      writable: true,
      value: vi.fn().mockResolvedValue(fileContents),
    });

    fireEvent.change(importInput, { target: { files: [file] } });

    await waitFor(() => expect(replaceProfile).toHaveBeenCalledWith({
      ...createEmptyProfile(),
      userName: 'Anna',
      favoriteCharacterIds: ['character-1'],
      mainCharacterId: 'character-1',
    }));
    expect(sonnerMocks.success).toHaveBeenCalledWith('Zaimportowano konfiguracje dla aktywnego API key.');
  });

  it('cancels quick link edit state when deleting the link being edited', () => {
    const removeQuickLink = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        quickLinks: [
          { id: 'link-1', label: 'Kompendium', type: 'route', href: '/compendium' },
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
      removeQuickLink,
      updateQuickLink: vi.fn(),
    });

    useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

    render(<PersonalizationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj link Kompendium' }));
    expect(screen.getByDisplayValue('Kompendium')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usun link Kompendium' }));

    expect(removeQuickLink).toHaveBeenCalledWith('link-1');
    expect(screen.queryByDisplayValue('Kompendium')).toBeNull();
  });

  it('updates the route when changed in the quick link edit panel', () => {
    const updateQuickLink = vi.fn();

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        quickLinks: [
          { id: 'link-1', label: 'Kompendium', type: 'route', href: '/compendium' },
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

    const routeSelect = document.getElementById('quick-link-edit-route-link-1');

    expect(routeSelect).not.toBeNull();

    fireEvent.click(routeSelect!);
    fireEvent.click(screen.getByText('Lista postaci'));

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(updateQuickLink).toHaveBeenCalledWith({
      id: 'link-1',
      label: 'Kompendium',
      type: 'route',
      href: '/characters',
    });
  });

  it('updates the bestiary column draft when the profile changes after the initial render', async () => {
    const { rerender } = render(
      (() => {
        usePersonalizationMock.mockReturnValue({
          apiKey: 'alpha',
          hasApiKey: true,
          isLoaded: true,
          profile: createEmptyProfile(),
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

        useFavoriteCharactersMock.mockReturnValue({ favoriteCharacters: [], isLoading: false });

        return <PersonalizationPage />;
      })(),
    );

    usePersonalizationMock.mockReturnValue({
      apiKey: 'alpha',
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        bestiaryColumnVisibility: { powers: true },
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

    rerender(<PersonalizationPage />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /moce/i })).toHaveProperty('checked', true);
    });
  });
});