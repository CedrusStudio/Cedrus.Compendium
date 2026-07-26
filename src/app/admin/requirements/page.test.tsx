import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAdminStatusMock = vi.fn();
const getStructuredRequirementsMock = vi.fn();
const editStructuredRequirementMock = vi.fn();
const deleteStructuredRequirementMock = vi.fn();

vi.mock('@/common/hooks/useAdminStatus', () => ({
  useAdminStatus: () => useAdminStatusMock(),
}));

vi.mock('@/infrastructure/clients/requirementsManagementClient', () => ({
  __esModule: true,
  default: {
    getStructuredRequirements: (...args: unknown[]) => getStructuredRequirementsMock(...args),
    editStructuredRequirement: (...args: unknown[]) => editStructuredRequirementMock(...args),
    deleteStructuredRequirement: (...args: unknown[]) => deleteStructuredRequirementMock(...args),
  },
}));

// The edit dialog mounts the requirement picker (Radix Select) only when opened;
// mock it so the manager can render/list without pulling in the full editor.
vi.mock('@/application/common/requirements/RequirementPicker', () => ({
  __esModule: true,
  default: () => <div data-testid="requirement-picker" />,
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
    getStructuredRequirementsMock.mockReset();
    editStructuredRequirementMock.mockReset();
    deleteStructuredRequirementMock.mockReset();
  });

  it('renders fetched structured requirements with their formatted label', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getStructuredRequirementsMock.mockResolvedValue([
      { requirement: { kind: 'rankless', text: 'lekka zbroja' }, count: 3 },
      { requirement: { kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 3 }, count: 2 },
    ]);

    renderPage();

    expect(await screen.findByText('lekka zbroja')).toBeTruthy();
    expect(screen.getByText('siła ≥ 3')).toBeTruthy();
  });

  it('shows an access message when the user is not an admin', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: false, isLoaded: true });

    renderPage();

    expect(screen.getByText('Ta sekcja jest dostepna tylko dla administratorow.')).toBeTruthy();
  });

  it('returns null while admin status is loading', () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: false, isCheckingAdmin: true, isLoaded: false });

    const { container } = renderPage();

    expect(container.firstChild).toBeNull();
  });

  it('opens the delete confirmation and calls the delete mutation with the requirement', async () => {
    useAdminStatusMock.mockReturnValue({ isAdmin: true, isCheckingAdmin: false, isLoaded: true });
    getStructuredRequirementsMock.mockResolvedValue([
      { requirement: { kind: 'rankless', text: 'lekka zbroja' }, count: 3 },
    ]);
    deleteStructuredRequirementMock.mockResolvedValue({ updatedCount: 3 });

    renderPage();

    expect(await screen.findByText('lekka zbroja')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usun' }));

    expect(screen.getByText('Wymaganie „lekka zbroja" zostanie usuniete z 3 rekordow.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Potwierdz usuniecie' }));

    await waitFor(() => {
      expect(deleteStructuredRequirementMock).toHaveBeenCalledWith({ entity: 'perks', requirement: { kind: 'rankless', text: 'lekka zbroja' } });
    });
  });
});
