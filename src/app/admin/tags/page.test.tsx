import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAdminStatusMock = vi.fn();
const getTagsMock = vi.fn();
const renameTagMock = vi.fn();
const deleteTagMock = vi.fn();

vi.mock('@/common/hooks/useAdminStatus', () => ({
  useAdminStatus: () => useAdminStatusMock(),
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

import TagManagementPage from '@/app/admin/tags/page';

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
    useAdminStatusMock.mockReset();
    getTagsMock.mockReset();
    renameTagMock.mockReset();
    deleteTagMock.mockReset();
  });

  it('renders fetched tags and opens the rename confirmation panel', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getTagsMock.mockResolvedValue([{ tag: 'miecze', count: 5 }]);

    renderPage();

    expect(await screen.findByText('miecze')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj' }));

    expect(screen.getByText('Tag miecze zostanie zmieniony w 5 rekordach.')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nowa wartość tagu')).toBeTruthy();
  });

  it('shows an access message when the user is not an admin', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: false, isLoaded: true });

    renderPage();

    expect(screen.getByText('Ta sekcja jest dostępna tylko dla administratorów.')).toBeTruthy();
  });

  it('returns null while admin status is loading', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: true, isLoaded: false });

    const { container } = renderPage();

    expect(container.firstChild).toBeNull();
  });

  it('calls the rename mutation with the selected entity and confirmation value', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getTagsMock.mockResolvedValue([{ tag: 'miecze', count: 2 }]);
    renameTagMock.mockResolvedValue({ updatedCount: 2 });

    renderPage();

    expect(await screen.findByText('miecze')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj' }));
    fireEvent.change(screen.getByPlaceholderText('Nowa wartość tagu'), { target: { value: 'ostrza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Potwierdź zmianę' }));

    await waitFor(() => {
      expect(renameTagMock).toHaveBeenCalledWith({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });
    });
  });

  it('opens the delete confirmation panel and calls the delete mutation', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getTagsMock.mockResolvedValue([{ tag: 'miecze', count: 4 }]);
    deleteTagMock.mockResolvedValue({ updatedCount: 4 });

    renderPage();

    expect(await screen.findByText('miecze')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }));

    expect(screen.getByText('Tag miecze zostanie usunięty z 4 rekordów.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Potwierdź usunięcie' }));

    await waitFor(() => {
      expect(deleteTagMock).toHaveBeenCalledWith({ entity: 'perks', tag: 'miecze' });
    });
  });
});
