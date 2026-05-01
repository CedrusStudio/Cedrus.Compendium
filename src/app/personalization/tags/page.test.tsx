import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useApiKeyMock = vi.fn();
const getTagsMock = vi.fn();
const renameTagMock = vi.fn();
const deleteTagMock = vi.fn();

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => useApiKeyMock(),
  getStoredApiKey: () => 'alpha',
}));

vi.mock('@/infrastructure/clients/tagManagementClient', () => ({
  __esModule: true,
  default: {
    getTags: (...args: unknown[]) => getTagsMock(...args),
    renameTag: (...args: unknown[]) => renameTagMock(...args),
    deleteTag: (...args: unknown[]) => deleteTagMock(...args),
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import TagManagementPage from '@/app/personalization/tags/page';

function renderPage()
{
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TagManagementPage />
    </QueryClientProvider>,
  );
}

describe('TagManagementPage', () => {
  beforeEach(() => {
    useApiKeyMock.mockReset();
    getTagsMock.mockReset();
    renameTagMock.mockReset();
    deleteTagMock.mockReset();
  });

  it('renders fetched tags and opens the rename confirmation panel', async () => {
    useApiKeyMock.mockReturnValue({ apiKey: 'alpha', hasApiKey: true, isLoaded: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    getTagsMock.mockResolvedValue([{ tag: 'miecze', count: 3 }]);

    renderPage();

    expect(await screen.findByText('miecze')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(screen.getByText('Tag miecze zostanie zmieniony w 3 rekordach.')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nowa wartosc tagu')).toBeTruthy();
  });

  it('disables destructive actions when no API key is configured', async () => {
    useApiKeyMock.mockReturnValue({ apiKey: null, hasApiKey: false, isLoaded: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    getTagsMock.mockResolvedValue([{ tag: 'miecze', count: 1 }]);

    renderPage();

    expect(await screen.findByText('miecze')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('calls the rename mutation with the selected entity and confirmation value', async () => {
    useApiKeyMock.mockReturnValue({ apiKey: 'alpha', hasApiKey: true, isLoaded: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    getTagsMock.mockResolvedValue([{ tag: 'miecze', count: 2 }]);
    renameTagMock.mockResolvedValue({ updatedCount: 2 });

    renderPage();

    expect(await screen.findByText('miecze')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.change(screen.getByPlaceholderText('Nowa wartosc tagu'), { target: { value: 'ostrza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Potwierdz rename' }));

    await waitFor(() => {
      expect(renameTagMock).toHaveBeenCalledWith({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });
    });
  });
});