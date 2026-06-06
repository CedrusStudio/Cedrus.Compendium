import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAdminStatusMock = vi.fn();
const getRequirementsMock = vi.fn();
const renameRequirementMock = vi.fn();
const deleteRequirementMock = vi.fn();

vi.mock('@/common/hooks/useAdminStatus', () => ({
  useAdminStatus: () => useAdminStatusMock(),
}));

vi.mock('@/infrastructure/clients/requirementsManagementClient', () => ({
  __esModule: true,
  default: {
    getRequirements: (...args: unknown[]) => getRequirementsMock(...args),
    renameRequirement: (...args: unknown[]) => renameRequirementMock(...args),
    deleteRequirement: (...args: unknown[]) => deleteRequirementMock(...args),
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import RequirementsManagementPage from '@/app/admin/requirements/page';

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
      <RequirementsManagementPage />
    </QueryClientProvider>,
  );
}

describe('RequirementsManagementPage', () => {
  beforeEach(() => {
    useAdminStatusMock.mockReset();
    getRequirementsMock.mockReset();
    renameRequirementMock.mockReset();
    deleteRequirementMock.mockReset();
  });

  it('renders fetched requirements and opens the rename confirmation panel', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getRequirementsMock.mockResolvedValue([{ requirement: 'Alchemia', count: 3 }]);

    renderPage();

    expect(await screen.findByText('Alchemia')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj' }));

    expect(screen.getByText('Wymaganie Alchemia zostanie zmienione w 3 rekordach.')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nowa wartosc wymagania')).toBeTruthy();
  });

  it('shows an access message when the user is not an admin', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: false, isLoaded: true });

    renderPage();

    expect(screen.getByText('Ta sekcja jest dostepna tylko dla administratorow.')).toBeTruthy();
  });

  it('calls the rename mutation with the selected entity and confirmation value', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getRequirementsMock.mockResolvedValue([{ requirement: 'Alchemia', count: 2 }]);
    renameRequirementMock.mockResolvedValue({ updatedCount: 2 });

    renderPage();

    expect(await screen.findByText('Alchemia')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj' }));
    fireEvent.change(screen.getByPlaceholderText('Nowa wartosc wymagania'), { target: { value: 'Zrecznosc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Potwierdz zmiane' }));

    await waitFor(() => {
      expect(renameRequirementMock).toHaveBeenCalledWith({ entity: 'perks', oldRequirement: 'Alchemia', newRequirement: 'Zrecznosc' });
    });
  });

  it('returns null while admin status is loading', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: true, isLoaded: false });

    const { container } = renderPage();

    expect(container.firstChild).toBeNull();
  });

  it('opens the delete confirmation panel and calls the delete mutation', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getRequirementsMock.mockResolvedValue([{ requirement: 'Alchemia', count: 3 }]);
    deleteRequirementMock.mockResolvedValue({ updatedCount: 3 });

    renderPage();

    expect(await screen.findByText('Alchemia')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usun' }));

    expect(screen.getByText('Wymaganie Alchemia zostanie usuniete z 3 rekordow.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Potwierdz usuniecie' }));

    await waitFor(() => {
      expect(deleteRequirementMock).toHaveBeenCalledWith({ entity: 'perks', requirement: 'Alchemia' });
    });
  });
});