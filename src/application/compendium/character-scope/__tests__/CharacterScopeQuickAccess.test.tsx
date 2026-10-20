import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '@/persistence/slices/store';
import { createEmptyProfile, type PersonalizationProfile } from '@/common/personalization/personalizationProfile';
import { CharacterScopeQuickAccess } from '../CharacterScopeQuickAccess';

const mocks = vi.hoisted(() => ({ search: vi.fn(), profiles: {} as Record<string, PersonalizationProfile> }));
vi.mock('react-redux', () => ({ useSelector: (selector: (state: RootState) => unknown) => selector({
  personalization: { profilesByApiKey: mocks.profiles },
} as RootState) }));
vi.mock('@/infrastructure/clients/searchClient', () => ({ default: { search: mocks.search } }));

const characters = [
  { id: 'main', name: 'Główna Aldara', shortName: 'Aldara', tags: [] },
  { id: 'favorite', name: 'Ulubiony Borin', shortName: 'Borin', tags: [] },
];
function setup(apiKey: string | null = 'key') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSelect = vi.fn();
  const tree = (key: string | null) => <QueryClientProvider client={client}>
    <CharacterScopeQuickAccess apiKey={key} selectedCharacterId="main" onSelect={onSelect} />
  </QueryClientProvider>;
  const result = render(tree(apiKey));
  return { ...result, onSelect, switchKey: (key: string) => result.rerender(tree(key)) };
}

describe('scope quick access', () => {
  beforeEach(() => {
    mocks.profiles = { key: { ...createEmptyProfile(), mainCharacterId: 'main', favoriteCharacterIds: ['main', 'favorite', 'favorite', 'missing'] } };
    mocks.search.mockReset().mockResolvedValue(characters);
  });

  it('offers main and favorites without duplicating the main character or unavailable favorites', async () => {
    const user = userEvent.setup(); const { onSelect } = setup();
    const main = await screen.findByRole('region', { name: 'Główna postać' });
    const favorites = screen.getByRole('region', { name: 'Ulubione postacie' });
    expect(within(main).getByRole('button', { name: 'Główna Aldara' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(favorites).getAllByRole('button')).toHaveLength(1);
    expect(within(favorites).queryByText('Główna Aldara')).not.toBeInTheDocument();
    await user.click(within(favorites).getByRole('button', { name: 'Ulubiony Borin' }));
    expect(onSelect).toHaveBeenCalledWith('favorite');
    await user.click(within(main).getByRole('button', { name: 'Główna Aldara' }));
    expect(onSelect).toHaveBeenLastCalledWith('main');
    expect(mocks.search).toHaveBeenCalledWith(expect.objectContaining({
      entity: 'character', search: { id: { anyOf: ['favorite', 'main', 'missing'] } },
      select: { id: true, name: true, shortName: true, tags: true }, pagination: { pageNumber: 1, pageSize: 3 },
    }));
  });

  it.each([null, 'empty'])('does not fetch shortcuts without a profile or API key (%s)', key => {
    setup(key);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it('shows favorites when no main character is configured', async () => {
    mocks.profiles.key = { ...createEmptyProfile(), favoriteCharacterIds: ['favorite'] };
    setup();
    await screen.findByRole('region', { name: 'Ulubione postacie' });
    expect(screen.queryByRole('region', { name: 'Główna postać' })).not.toBeInTheDocument();
  });

  it('reports an inaccessible main character and does not offer an ID as a selectable name', async () => {
    mocks.search.mockResolvedValue([]);
    setup();
    await screen.findByText('Postać główna jest niedostępna.');
    expect(screen.getByText('Brak dostępnych ulubionych postaci.')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('provides a retry after a failed shortcut read', async () => {
    mocks.search.mockRejectedValueOnce(new Error('Offline'));
    const user = userEvent.setup(); setup();
    const alert = await screen.findByRole('alert');
    await user.click(within(alert).getByRole('button'));
    await screen.findByRole('button', { name: 'Główna Aldara' });
  });

  it('does not expose cached shortcuts from another API key', async () => {
    mocks.profiles.second = { ...createEmptyProfile(), mainCharacterId: 'other' };
    const { switchKey } = setup();
    await screen.findByRole('button', { name: 'Główna Aldara' });
    mocks.search.mockResolvedValue([{ id: 'other', name: 'Drugi klucz', shortName: 'Drugi', tags: [] }]);
    switchKey('second');
    expect(screen.queryByRole('button', { name: 'Główna Aldara' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Drugi klucz' })).toBeVisible());
  });
});
